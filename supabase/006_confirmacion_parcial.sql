-- ============================================================
-- Migración 006 — Confirmaciones parciales hasta agotar pases
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Obtener las confirmaciones ya registradas de un invitado por su token
--    (permite mostrar "Ya confirmaste X de Y pases" sin abrir la tabla confirmaciones a anon)
CREATE OR REPLACE FUNCTION public.obtener_confirmaciones_invitado(p_token UUID)
RETURNS TABLE (
    id              UUID,
    nombre          TEXT,
    apellido        TEXT,
    nombre_completo TEXT,
    es_titular      BOOLEAN,
    plato_fuerte    TEXT,
    contornos       TEXT[],
    created_at      TIMESTAMPTZ
)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
    SELECT c.id, c.nombre, c.apellido, c.nombre_completo,
           c.es_titular, c.plato_fuerte, c.contornos, c.created_at
    FROM confirmaciones c
    JOIN invitados i ON i.id = c.invitado_id
    WHERE i.token = p_token
    ORDER BY c.es_titular DESC, c.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.obtener_confirmaciones_invitado(UUID) TO anon, authenticated;

-- 2. Actualizar confirmar_asistencia para permitir confirmaciones parciales
--    hasta agotar el cupo total (1 + slots_totales)
CREATE OR REPLACE FUNCTION public.confirmar_asistencia(p_token UUID, p_asistentes JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_inv           invitados;
    v_menu          JSONB;
    v_existentes    INT;
    v_tiene_titular BOOLEAN;
    v_n             INT;
    v_i             INT := 0;
    a               JSONB;
    v_es_titular    BOOLEAN;
    v_nom           TEXT;
    v_ape           TEXT;
    v_cont          JSONB;
BEGIN
    SELECT * INTO v_inv FROM invitados WHERE token = p_token FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'invitacion_invalida';
    END IF;

    SELECT count(*), COALESCE(bool_or(es_titular), FALSE)
    INTO v_existentes, v_tiene_titular
    FROM confirmaciones
    WHERE invitado_id = v_inv.id;

    IF v_existentes >= 1 + v_inv.slots_totales THEN
        RAISE EXCEPTION 'cupo_agotado';
    END IF;

    IF p_asistentes IS NULL OR jsonb_typeof(p_asistentes) <> 'array' THEN
        RAISE EXCEPTION 'sin_asistentes';
    END IF;
    v_n := jsonb_array_length(p_asistentes);
    IF v_n < 1 THEN
        RAISE EXCEPTION 'sin_asistentes';
    END IF;
    IF v_existentes + v_n > 1 + v_inv.slots_totales THEN
        RAISE EXCEPTION 'cupo_excedido';
    END IF;

    SELECT menu INTO v_menu FROM configuracion WHERE id = 'default';

    FOR a IN SELECT * FROM jsonb_array_elements(p_asistentes) LOOP
        -- Si aún no hay titular registrado, el primer registro es el titular
        v_es_titular := (NOT v_tiene_titular AND v_i = 0);

        IF v_es_titular THEN
            v_nom := v_inv.nombre;
            v_ape := v_inv.apellido;
        ELSE
            v_nom := btrim(COALESCE(a->>'nombre', ''));
            v_ape := btrim(COALESCE(a->>'apellido', ''));
        END IF;

        IF v_nom = '' OR v_ape = '' THEN
            RAISE EXCEPTION 'datos_incompletos';
        END IF;
        IF COALESCE(a->>'plato_fuerte', '') = '' THEN
            RAISE EXCEPTION 'menu_incompleto';
        END IF;

        v_cont := COALESCE(a->'contornos', '[]'::jsonb);

        IF v_menu IS NOT NULL THEN
            IF NOT EXISTS (
                SELECT 1 FROM jsonb_array_elements(v_menu->'platosFuertes') p
                WHERE p->>'id' = a->>'plato_fuerte'
            ) THEN
                RAISE EXCEPTION 'plato_invalido';
            END IF;
            IF jsonb_array_length(v_cont) > COALESCE((v_menu->>'maxContornos')::INT, 2) THEN
                RAISE EXCEPTION 'demasiados_contornos';
            END IF;
            IF EXISTS (
                SELECT 1 FROM jsonb_array_elements_text(v_cont) c
                WHERE c NOT IN (SELECT ct->>'id' FROM jsonb_array_elements(v_menu->'contornos') ct)
            ) THEN
                RAISE EXCEPTION 'contorno_invalido';
            END IF;
        END IF;

        INSERT INTO confirmaciones
            (invitado_id, nombre, apellido, nombre_completo, es_titular, plato_fuerte, contornos, regalo_id)
        VALUES
            (v_inv.id, v_nom, v_ape, v_nom || ' ' || v_ape, v_es_titular,
             a->>'plato_fuerte',
             ARRAY(SELECT jsonb_array_elements_text(v_cont)),
             NULLIF(a->>'regalo_id', ''));

        v_i := v_i + 1;
    END LOOP;

    UPDATE invitados SET confirmed_at = COALESCE(confirmed_at, now())
    WHERE id = v_inv.id RETURNING * INTO v_inv;

    RETURN to_jsonb(v_inv);
END $$;
