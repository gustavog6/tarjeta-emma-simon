-- ============================================================
-- Migración 004 — Integridad de datos, seguridad y configuración completa
-- Ejecutar en: Supabase Dashboard → SQL Editor
--
-- ORDEN: 001 → 002 → 003 → 004  (esta migración requiere que 003 ya esté aplicada)
--
-- Qué hace:
--   1. Columnas nuevas (acompañantes con nombre/apellido, config completa)
--   2. Normaliza plato/contornos guardados por NOMBRE a su ID
--   3. Reglas de integridad (cupo, un solo titular, datos mínimos, slots)
--   4. Triggers que mantienen confirmed_at siempre coherente
--   5. Funciones RPC seguras (el invitado ya NO lee ni escribe tablas directo)
--   6. RLS restrictiva: solo los novios (usuarios autenticados) administran
-- ============================================================


-- ─── 1. Columnas nuevas ───────────────────────────────────
ALTER TABLE confirmaciones
    ADD COLUMN IF NOT EXISTS nombre   TEXT,
    ADD COLUMN IF NOT EXISTS apellido TEXT;

ALTER TABLE configuracion
    ADD COLUMN IF NOT EXISTS padres             JSONB NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS padrinos           JSONB NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS textos             JSONB NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS url_publica        TEXT,
    ADD COLUMN IF NOT EXISTS plantilla_whatsapp TEXT;

-- Backfill nombre/apellido en confirmaciones existentes
UPDATE confirmaciones c
SET nombre = i.nombre, apellido = i.apellido
FROM invitados i
WHERE c.invitado_id = i.id AND c.es_titular AND c.nombre IS NULL;

UPDATE confirmaciones
SET nombre   = split_part(btrim(nombre_completo), ' ', 1),
    apellido = btrim(substr(btrim(nombre_completo), length(split_part(btrim(nombre_completo), ' ', 1)) + 1))
WHERE nombre IS NULL;


-- ─── 2. Normalizar plato y contornos a ID ─────────────────
-- (el RSVP guardaba IDs y el panel guardaba nombres: se unifica en IDs)
UPDATE confirmaciones c
SET plato_fuerte = p->>'id'
FROM configuracion cfg, jsonb_array_elements(cfg.menu->'platosFuertes') p
WHERE cfg.id = 'default' AND c.plato_fuerte = p->>'nombre';

UPDATE confirmaciones c
SET contornos = ARRAY(
    SELECT COALESCE(
        (SELECT ct->>'id'
         FROM configuracion cfg, jsonb_array_elements(cfg.menu->'contornos') ct
         WHERE cfg.id = 'default' AND ct->>'nombre' = u.e
         LIMIT 1),
        u.e)
    FROM unnest(c.contornos) WITH ORDINALITY AS u(e, ord)
    ORDER BY u.ord)
WHERE c.contornos IS NOT NULL AND array_length(c.contornos, 1) > 0;


-- ─── 3. Reglas de integridad ──────────────────────────────
-- 3a. Un solo titular por invitado (limpia duplicados de pruebas: conserva el más antiguo)
DELETE FROM confirmaciones c
USING confirmaciones d
WHERE c.es_titular AND d.es_titular
  AND c.invitado_id = d.invitado_id
  AND (c.created_at, c.id) > (d.created_at, d.id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_confirmaciones_titular
    ON confirmaciones (invitado_id) WHERE es_titular;

-- 3b. slots_totales nunca negativo
ALTER TABLE invitados DROP CONSTRAINT IF EXISTS invitados_slots_totales_nonneg;
ALTER TABLE invitados ADD CONSTRAINT invitados_slots_totales_nonneg CHECK (slots_totales >= 0);

-- 3c. Datos mínimos obligatorios (NOT VALID = aplica a altas y ediciones nuevas;
--     no rechaza filas viejas que quizá no tengan teléfono)
ALTER TABLE invitados DROP CONSTRAINT IF EXISTS invitados_datos_minimos;
ALTER TABLE invitados ADD CONSTRAINT invitados_datos_minimos CHECK (
    length(btrim(nombre)) > 0
    AND length(btrim(apellido)) > 0
    AND length(btrim(COALESCE(telefono, ''))) > 0
) NOT VALID;


-- ─── 4. Triggers de coherencia ────────────────────────────
-- 4a. Antes de insertar una confirmación: respetar el cupo (1 + slots_totales)
CREATE OR REPLACE FUNCTION public.trg_confirmaciones_before_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_slots INT;
    v_count INT;
BEGIN
    SELECT slots_totales INTO v_slots FROM invitados WHERE id = NEW.invitado_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'invitacion_invalida';
    END IF;

    SELECT count(*) INTO v_count FROM confirmaciones WHERE invitado_id = NEW.invitado_id;
    IF v_count >= 1 + v_slots THEN
        RAISE EXCEPTION 'cupo_excedido';
    END IF;

    -- nombre_completo siempre derivado de nombre + apellido cuando existen
    IF NEW.nombre IS NOT NULL AND NEW.apellido IS NOT NULL THEN
        NEW.nombre_completo := btrim(NEW.nombre) || ' ' || btrim(NEW.apellido);
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS confirmaciones_before_insert ON confirmaciones;
CREATE TRIGGER confirmaciones_before_insert
    BEFORE INSERT ON confirmaciones
    FOR EACH ROW EXECUTE FUNCTION public.trg_confirmaciones_before_insert();

-- 4b. Después de insertar: el invitado queda marcado como confirmado
CREATE OR REPLACE FUNCTION public.trg_confirmaciones_after_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    UPDATE invitados SET confirmed_at = COALESCE(confirmed_at, now()) WHERE id = NEW.invitado_id;
    RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS confirmaciones_after_insert ON confirmaciones;
CREATE TRIGGER confirmaciones_after_insert
    AFTER INSERT ON confirmaciones
    FOR EACH ROW EXECUTE FUNCTION public.trg_confirmaciones_after_insert();

-- 4c. Después de borrar: si no queda nadie, el invitado vuelve a "sin confirmar"
--     (NUNCA borra al invitado)
CREATE OR REPLACE FUNCTION public.trg_confirmaciones_after_delete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    UPDATE invitados
    SET confirmed_at = NULL
    WHERE id = OLD.invitado_id
      AND NOT EXISTS (SELECT 1 FROM confirmaciones WHERE invitado_id = OLD.invitado_id);
    RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS confirmaciones_after_delete ON confirmaciones;
CREATE TRIGGER confirmaciones_after_delete
    AFTER DELETE ON confirmaciones
    FOR EACH ROW EXECUTE FUNCTION public.trg_confirmaciones_after_delete();

-- 4d. No permitir bajar slots_totales por debajo de las personas ya confirmadas
CREATE OR REPLACE FUNCTION public.trg_invitados_before_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_count INT;
BEGIN
    IF NEW.slots_totales < OLD.slots_totales THEN
        SELECT count(*) INTO v_count FROM confirmaciones WHERE invitado_id = NEW.id;
        IF v_count > 1 + NEW.slots_totales THEN
            RAISE EXCEPTION 'slots_menor_que_confirmados';
        END IF;
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS invitados_before_update ON invitados;
CREATE TRIGGER invitados_before_update
    BEFORE UPDATE ON invitados
    FOR EACH ROW EXECUTE FUNCTION public.trg_invitados_before_update();


-- ─── 5. Funciones RPC ─────────────────────────────────────

-- 5a. Obtener SOLO el invitado dueño del token (sustituye el SELECT público a la tabla)
CREATE OR REPLACE FUNCTION public.obtener_invitado(p_token UUID)
RETURNS SETOF invitados LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
    SELECT * FROM invitados WHERE token = p_token;
$$;

-- 5b. Confirmar asistencia: TODO o NADA, validado en el servidor
CREATE OR REPLACE FUNCTION public.confirmar_asistencia(p_token UUID, p_asistentes JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_inv   invitados;
    v_menu  JSONB;
    v_n     INT;
    v_i     INT := 0;
    a       JSONB;
    v_nom   TEXT;
    v_ape   TEXT;
    v_cont  JSONB;
BEGIN
    SELECT * INTO v_inv FROM invitados WHERE token = p_token FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'invitacion_invalida';
    END IF;

    IF v_inv.confirmed_at IS NOT NULL
       OR EXISTS (SELECT 1 FROM confirmaciones WHERE invitado_id = v_inv.id) THEN
        RAISE EXCEPTION 'ya_confirmado';
    END IF;

    IF p_asistentes IS NULL OR jsonb_typeof(p_asistentes) <> 'array' THEN
        RAISE EXCEPTION 'sin_asistentes';
    END IF;
    v_n := jsonb_array_length(p_asistentes);
    IF v_n < 1 THEN
        RAISE EXCEPTION 'sin_asistentes';
    END IF;
    IF v_n > 1 + v_inv.slots_totales THEN
        RAISE EXCEPTION 'cupo_excedido';
    END IF;

    SELECT menu INTO v_menu FROM configuracion WHERE id = 'default';

    FOR a IN SELECT * FROM jsonb_array_elements(p_asistentes) LOOP
        -- El primer asistente es SIEMPRE el titular y usa los datos del invitado
        IF v_i = 0 THEN
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
            (v_inv.id, v_nom, v_ape, v_nom || ' ' || v_ape, (v_i = 0),
             a->>'plato_fuerte',
             ARRAY(SELECT jsonb_array_elements_text(v_cont)),
             NULLIF(a->>'regalo_id', ''));

        v_i := v_i + 1;
    END LOOP;

    UPDATE invitados SET confirmed_at = COALESCE(confirmed_at, now())
    WHERE id = v_inv.id RETURNING * INTO v_inv;

    RETURN to_jsonb(v_inv);
END $$;

-- 5c. Reiniciar confirmación (solo novios): borra respuestas, el invitado SE QUEDA
CREATE OR REPLACE FUNCTION public.reiniciar_confirmacion(p_invitado UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF auth.role() <> 'authenticated' THEN
        RAISE EXCEPTION 'no_autorizado';
    END IF;
    DELETE FROM confirmaciones WHERE invitado_id = p_invitado;
    UPDATE invitados SET confirmed_at = NULL WHERE id = p_invitado;
END $$;

-- 5d. Galería pública: fotos aprobadas + nombre del autor (sin exponer la tabla invitados)
CREATE OR REPLACE FUNCTION public.galeria_publica()
RETURNS TABLE (id UUID, storage_path TEXT, created_at TIMESTAMPTZ, autor TEXT)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
    SELECT f.id, f.storage_path, f.created_at, btrim(i.nombre || ' ' || i.apellido)
    FROM fotos f JOIN invitados i ON i.id = f.invitado_id
    WHERE f.estado = 'aprobada'
    ORDER BY f.created_at DESC;
$$;

-- 5e. ¿Puede este invitado subir fotos? (usada por la política de INSERT en fotos)
CREATE OR REPLACE FUNCTION public.puede_subir_fotos(p_invitado UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
    SELECT COALESCE((SELECT puede_subir_fotos FROM invitados WHERE id = p_invitado), FALSE);
$$;

-- Permisos de ejecución
REVOKE EXECUTE ON FUNCTION public.reiniciar_confirmacion(UUID) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.reiniciar_confirmacion(UUID) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.obtener_invitado(UUID)          TO anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.confirmar_asistencia(UUID, JSONB) TO anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.galeria_publica()               TO anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.puede_subir_fotos(UUID)         TO anon, authenticated;


-- ─── 6. RLS restrictiva ───────────────────────────────────
-- Regla: anon (cualquier visitante) NO toca invitados ni confirmaciones directamente.
--        authenticated (los novios, con login) administran todo.

ALTER TABLE invitados      ENABLE ROW LEVEL SECURITY;
ALTER TABLE confirmaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion  ENABLE ROW LEVEL SECURITY;

-- Quitar TODAS las políticas anteriores
DROP POLICY IF EXISTS "Admin gestiona invitados"        ON invitados;
DROP POLICY IF EXISTS "Insertar confirmacion"           ON confirmaciones;
DROP POLICY IF EXISTS "Leer confirmaciones propias"     ON confirmaciones;
DROP POLICY IF EXISTS "Admin gestiona confirmaciones"   ON confirmaciones;
DROP POLICY IF EXISTS "Insertar foto"                   ON fotos;
DROP POLICY IF EXISTS "Permitir leer fotos"             ON fotos;
DROP POLICY IF EXISTS "Permitir actualizar fotos"       ON fotos;
DROP POLICY IF EXISTS "Lectura publica configuracion"   ON configuracion;
DROP POLICY IF EXISTS "Admin actualiza configuracion"   ON configuracion;

-- Privilegios a nivel tabla
REVOKE ALL ON TABLE invitados, confirmaciones, fotos, configuracion FROM anon;
GRANT ALL ON TABLE invitados, confirmaciones, fotos, configuracion TO authenticated, service_role;
GRANT SELECT         ON TABLE configuracion TO anon;
GRANT SELECT, INSERT ON TABLE fotos         TO anon;

-- invitados / confirmaciones: solo novios
CREATE POLICY "Novios gestionan invitados"
    ON invitados FOR ALL TO authenticated
    USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Novios gestionan confirmaciones"
    ON confirmaciones FOR ALL TO authenticated
    USING (TRUE) WITH CHECK (TRUE);

-- configuracion: lectura pública, escritura solo novios
CREATE POLICY "Lectura publica configuracion"
    ON configuracion FOR SELECT TO anon, authenticated
    USING (TRUE);

CREATE POLICY "Novios editan configuracion"
    ON configuracion FOR ALL TO authenticated
    USING (TRUE) WITH CHECK (TRUE);

-- fotos: el público ve solo aprobadas y sube solo si tiene permiso (siempre en 'pendiente')
CREATE POLICY "Publico ve fotos aprobadas"
    ON fotos FOR SELECT TO anon
    USING (estado = 'aprobada');

CREATE POLICY "Invitado con permiso sube foto"
    ON fotos FOR INSERT TO anon
    WITH CHECK (estado = 'pendiente' AND public.puede_subir_fotos(invitado_id));

CREATE POLICY "Novios moderan fotos"
    ON fotos FOR ALL TO authenticated
    USING (TRUE) WITH CHECK (TRUE);

-- Storage: los novios pueden borrar archivos de la galería
DROP POLICY IF EXISTS "Admin elimina de galeria" ON storage.objects;
CREATE POLICY "Novios eliminan de galeria"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'galeria');


-- ─── 7. Semilla de la configuración nueva ─────────────────
UPDATE configuracion SET
    padres = $json$ {
        "novia": {"padre": "Sr. Carlos González", "madre": "Sra. Elena de González"},
        "novio": {"padre": "Sr. Simón España",    "madre": "Sra. Carmen de España"}
    } $json$::jsonb,
    padrinos = $json$ [
        {"nombre": "Sr. Roberto Méndez", "rol": "Padrino"},
        {"nombre": "Sra. María Valentina Rossi", "rol": "Madrina"}
    ] $json$::jsonb,
    textos = $json$ {
        "hero":        {"badge": "Nos casamos"},
        "saveTheDate": {"titulo": "Save the Date", "diaSemana": "Sábado"},
        "eventCards":  {"titulo": "Acompáñanos", "subtitulo": "Será un honor para nosotros contar con tu presencia en este día tan especial."},
        "itinerario":  {"titulo": "Itinerario"},
        "rsvp":        {"titulo": "Confirmar Asistencia", "subtitulo": "Esperamos contar contigo. Por favor confirma tu asistencia antes del 26 de enero."},
        "regalos":     {"titulo": "Mesa de Regalos", "subtitulo": "Su presencia es nuestro mejor regalo, pero si desean tener un detalle con nosotros:"},
        "quote":       {"texto": "\"Estamos muy emocionados de compartir este día contigo.\"", "firma": "Con amor, Simón & Emma"},
        "footer":      {"versiculo": "\"¡Graba mi nombre en tu corazón! ¡Graba mi imagen en tu brazo! ¡Tan fuerte es el amor como la muerte! ¡Tan cierta es la pasión como la tumba! ¡El fuego del amor es una llama que Dios mismo ha encendido!\"", "referencia": "Cantares 8:6-7 TLA"},
        "overlay":     {"boton": "Abrir invitación"}
    } $json$::jsonb,
    url_publica = 'https://emmaysimon.netlify.app',
    plantilla_whatsapp = E'¡Hola {nombre}! Estamos muy felices de compartir nuestro día contigo. Esta invitación es válida para {personas}. Confírmanos tu asistencia y menú antes del {fecha_limite}. Nos vemos pronto. Con amor, {novios} ✨\n\n{enlace}'
WHERE id = 'default' AND padres = '{}'::jsonb;

-- ============================================================
-- DESPUÉS DE EJECUTAR ESTE SCRIPT (pasos manuales en el Dashboard):
--   1. Authentication → Users → "Add user" → crea la cuenta de los novios
--      (correo + contraseña, marca "Auto Confirm User").
--   2. Authentication → Sign In / Providers → desactiva "Allow new users to sign up"
--      (si no, cualquiera podría crearse una cuenta y entrar como administrador).
-- ============================================================
