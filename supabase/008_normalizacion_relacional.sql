-- ============================================================
-- Migración 008 — Normalización 100% Relacional (Cero JSONB)
-- Ejecutar en: Supabase Dashboard → SQL Editor
--
-- Reemplaza todas las columnas JSONB de `configuracion` por:
--   • Columnas escalares planas en `configuracion`
--   • 7 tablas relacionales independientes editables en Table Editor:
--       grupos, menu_platos, menu_contornos, venues,
--       itinerario_items, datos_bancarios, padrinos
--   • FK real: invitados.grupo -> grupos(id)
--   • CHECK constraints nativos por columna + triggers min/max
--   • Migración automática de datos existentes sin pérdida
-- ============================================================

-- ─── 1. Limpiar trigger y constraint JSONB de migración 007 ──────────
DROP TRIGGER  IF EXISTS configuracion_validar_limites ON configuracion;
DROP FUNCTION IF EXISTS public.trg_configuracion_validar_limites();
ALTER TABLE configuracion DROP CONSTRAINT IF EXISTS chk_config_limites_arrays;

-- ─── 2. Crear tablas relacionales normalizadas ───────────────────────

CREATE TABLE IF NOT EXISTS grupos (
    id       TEXT PRIMARY KEY,
    nombre   TEXT NOT NULL CHECK (char_length(btrim(nombre)) BETWEEN 1 AND 30),
    color    TEXT NOT NULL DEFAULT 'gray'
             CHECK (color IN ('pink', 'blue', 'green', 'purple', 'amber', 'gray')),
    whatsapp TEXT CHECK (whatsapp IS NULL OR char_length(whatsapp) <= 25),
    orden    INT  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS menu_platos (
    id     TEXT PRIMARY KEY,
    nombre TEXT NOT NULL CHECK (char_length(btrim(nombre)) BETWEEN 1 AND 55),
    orden  INT  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS menu_contornos (
    id     TEXT PRIMARY KEY,
    nombre TEXT NOT NULL CHECK (char_length(btrim(nombre)) BETWEEN 1 AND 40),
    orden  INT  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS venues (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tipo          TEXT NOT NULL DEFAULT 'ceremony'
                  CHECK (tipo IN ('ceremony', 'reception', 'live', 'videocall')),
    titulo        TEXT NOT NULL CHECK (char_length(btrim(titulo)) BETWEEN 1 AND 40),
    lugar         TEXT CHECK (lugar         IS NULL OR char_length(lugar)         <= 60),
    direccion     TEXT CHECK (direccion     IS NULL OR char_length(direccion)     <= 120),
    hora          TEXT CHECK (hora          IS NULL OR char_length(hora)          <= 25),
    map_url       TEXT CHECK (map_url       IS NULL OR char_length(map_url)       <= 500),
    external_link TEXT CHECK (external_link IS NULL OR char_length(external_link) <= 500),
    plataforma    TEXT CHECK (plataforma    IS NULL OR char_length(plataforma)    <= 60),
    stream_url    TEXT CHECK (stream_url    IS NULL OR char_length(stream_url)    <= 500),
    codigo_acceso TEXT CHECK (codigo_acceso IS NULL OR char_length(codigo_acceso) <= 120),
    orden         INT  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS itinerario_items (
    id     TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    hora   TEXT NOT NULL CHECK (char_length(btrim(hora))   BETWEEN 1 AND 15),
    titulo TEXT NOT NULL CHECK (char_length(btrim(titulo)) BETWEEN 1 AND 55),
    icono  TEXT NOT NULL DEFAULT 'MapPin' CHECK (char_length(btrim(icono)) BETWEEN 1 AND 30),
    orden  INT  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS datos_bancarios (
    id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tipo       TEXT NOT NULL DEFAULT 'Pago Móvil'
               CHECK (tipo IN ('Pago Móvil', 'Binance Pay')),
    banco      TEXT NOT NULL CHECK (char_length(btrim(banco))   BETWEEN 1 AND 35),
    titular    TEXT NOT NULL CHECK (char_length(btrim(titular)) BETWEEN 1 AND 50),
    telefono   TEXT CHECK (telefono   IS NULL OR char_length(telefono)   <= 35),
    cedula     TEXT CHECK (cedula     IS NULL OR char_length(cedula)     <= 35),
    binance_id TEXT CHECK (binance_id IS NULL OR char_length(binance_id) <= 35),
    orden      INT  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS padrinos (
    id     TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    nombre TEXT NOT NULL CHECK (char_length(btrim(nombre)) BETWEEN 1 AND 50),
    rol    TEXT NOT NULL CHECK (char_length(btrim(rol))    BETWEEN 1 AND 30),
    orden  INT  NOT NULL DEFAULT 0
);

-- ─── 3. Columnas escalares planas en `configuracion` ─────────────────
ALTER TABLE configuracion
    ADD COLUMN IF NOT EXISTS novia_nombre            TEXT NOT NULL DEFAULT 'Emma',
    ADD COLUMN IF NOT EXISTS novia_apellido          TEXT DEFAULT 'González',
    ADD COLUMN IF NOT EXISTS novia_whatsapp          TEXT DEFAULT '+584249743171',
    ADD COLUMN IF NOT EXISTS novio_nombre            TEXT NOT NULL DEFAULT 'Simón',
    ADD COLUMN IF NOT EXISTS novio_apellido          TEXT DEFAULT 'España',
    ADD COLUMN IF NOT EXISTS novio_whatsapp          TEXT DEFAULT '+584140110568',
    ADD COLUMN IF NOT EXISTS vestimenta_tipo         TEXT DEFAULT 'Elegante / Casual',
    ADD COLUMN IF NOT EXISTS max_contornos           INT  NOT NULL DEFAULT 2,
    ADD COLUMN IF NOT EXISTS padres_novia_padre      TEXT,
    ADD COLUMN IF NOT EXISTS padres_novia_madre      TEXT,
    ADD COLUMN IF NOT EXISTS padres_novio_padre      TEXT,
    ADD COLUMN IF NOT EXISTS padres_novio_madre      TEXT,
    ADD COLUMN IF NOT EXISTS hero_badge              TEXT DEFAULT 'Nos casamos',
    ADD COLUMN IF NOT EXISTS save_the_date_titulo    TEXT DEFAULT 'Save the Date',
    ADD COLUMN IF NOT EXISTS save_the_date_dia_semana TEXT DEFAULT 'Sábado',
    ADD COLUMN IF NOT EXISTS event_cards_titulo      TEXT DEFAULT 'Acompáñanos',
    ADD COLUMN IF NOT EXISTS event_cards_subtitulo   TEXT DEFAULT 'Será un honor para nosotros contar con tu presencia en este día tan especial.',
    ADD COLUMN IF NOT EXISTS itinerario_titulo       TEXT DEFAULT 'Itinerario',
    ADD COLUMN IF NOT EXISTS rsvp_titulo             TEXT DEFAULT 'Confirmar Asistencia',
    ADD COLUMN IF NOT EXISTS rsvp_subtitulo          TEXT DEFAULT 'Esperamos contar contigo. Por favor confirma tu asistencia.',
    ADD COLUMN IF NOT EXISTS regalos_titulo          TEXT DEFAULT 'Mesa de Regalos',
    ADD COLUMN IF NOT EXISTS regalos_subtitulo       TEXT DEFAULT 'Su presencia es nuestro mejor regalo, pero si desean tener un detalle con nosotros:',
    ADD COLUMN IF NOT EXISTS quote_texto             TEXT DEFAULT '"Estamos muy emocionados de compartir este día contigo."',
    ADD COLUMN IF NOT EXISTS quote_firma             TEXT DEFAULT 'Con amor, Simón & Emma',
    ADD COLUMN IF NOT EXISTS footer_versiculo        TEXT,
    ADD COLUMN IF NOT EXISTS footer_referencia       TEXT,
    ADD COLUMN IF NOT EXISTS overlay_boton           TEXT DEFAULT 'Abrir invitación';

-- ─── 4. Migrar datos existentes desde JSONB (si las columnas existen) ─
DO $$
DECLARE
    v_has_jsonb BOOLEAN;
    v_cfg       RECORD;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'configuracion' AND column_name = 'novios'
    ) INTO v_has_jsonb;

    IF v_has_jsonb THEN
        SELECT * INTO v_cfg FROM configuracion WHERE id = 'default';
        IF FOUND THEN
            -- 4a. Campos escalares
            UPDATE configuracion SET
                novia_nombre             = COALESCE(NULLIF(btrim(v_cfg.novios->'novia'->>'nombre'), ''), novia_nombre),
                novia_apellido           = COALESCE(v_cfg.novios->'novia'->>'apellido', novia_apellido),
                novia_whatsapp           = COALESCE(v_cfg.novios->'novia'->>'whatsapp', novia_whatsapp),
                novio_nombre             = COALESCE(NULLIF(btrim(v_cfg.novios->'novio'->>'nombre'), ''), novio_nombre),
                novio_apellido           = COALESCE(v_cfg.novios->'novio'->>'apellido', novio_apellido),
                novio_whatsapp           = COALESCE(v_cfg.novios->'novio'->>'whatsapp', novio_whatsapp),
                vestimenta_tipo          = COALESCE(v_cfg.vestimenta->>'tipo', vestimenta_tipo),
                max_contornos            = COALESCE((v_cfg.menu->>'maxContornos')::INT, max_contornos),
                padres_novia_padre       = v_cfg.padres->'novia'->>'padre',
                padres_novia_madre       = v_cfg.padres->'novia'->>'madre',
                padres_novio_padre       = v_cfg.padres->'novio'->>'padre',
                padres_novio_madre       = v_cfg.padres->'novio'->>'madre',
                hero_badge               = COALESCE(v_cfg.textos->'hero'->>'badge', hero_badge),
                save_the_date_titulo     = COALESCE(v_cfg.textos->'saveTheDate'->>'titulo', save_the_date_titulo),
                save_the_date_dia_semana = COALESCE(v_cfg.textos->'saveTheDate'->>'diaSemana', save_the_date_dia_semana),
                event_cards_titulo       = COALESCE(v_cfg.textos->'eventCards'->>'titulo', event_cards_titulo),
                event_cards_subtitulo    = COALESCE(v_cfg.textos->'eventCards'->>'subtitulo', event_cards_subtitulo),
                itinerario_titulo        = COALESCE(v_cfg.textos->'itinerario'->>'titulo', itinerario_titulo),
                rsvp_titulo              = COALESCE(v_cfg.textos->'rsvp'->>'titulo', rsvp_titulo),
                rsvp_subtitulo           = COALESCE(v_cfg.textos->'rsvp'->>'subtitulo', rsvp_subtitulo),
                regalos_titulo           = COALESCE(v_cfg.textos->'regalos'->>'titulo', regalos_titulo),
                regalos_subtitulo        = COALESCE(v_cfg.textos->'regalos'->>'subtitulo', regalos_subtitulo),
                quote_texto              = COALESCE(v_cfg.textos->'quote'->>'texto', quote_texto),
                quote_firma              = COALESCE(v_cfg.textos->'quote'->>'firma', quote_firma),
                footer_versiculo         = COALESCE(v_cfg.textos->'footer'->>'versiculo', footer_versiculo),
                footer_referencia        = COALESCE(v_cfg.textos->'footer'->>'referencia', footer_referencia),
                overlay_boton            = COALESCE(v_cfg.textos->'overlay'->>'boton', overlay_boton)
            WHERE id = 'default';

            -- 4b. Grupos
            INSERT INTO grupos (id, nombre, color, whatsapp, orden)
            SELECT elem->>'id', elem->>'nombre',
                   CASE WHEN elem->>'color' IN ('pink','blue','green','purple','amber','gray') THEN elem->>'color' ELSE 'gray' END,
                   NULLIF(elem->>'whatsapp', ''), (ord - 1)::INT
            FROM jsonb_array_elements(COALESCE(v_cfg.grupos, '[]'::jsonb)) WITH ORDINALITY AS t(elem, ord)
            ON CONFLICT (id) DO NOTHING;

            -- 4c. Platos fuertes
            INSERT INTO menu_platos (id, nombre, orden)
            SELECT elem->>'id', elem->>'nombre', (ord - 1)::INT
            FROM jsonb_array_elements(COALESCE(v_cfg.menu->'platosFuertes', '[]'::jsonb)) WITH ORDINALITY AS t(elem, ord)
            ON CONFLICT (id) DO NOTHING;

            -- 4d. Contornos
            INSERT INTO menu_contornos (id, nombre, orden)
            SELECT elem->>'id', elem->>'nombre', (ord - 1)::INT
            FROM jsonb_array_elements(COALESCE(v_cfg.menu->'contornos', '[]'::jsonb)) WITH ORDINALITY AS t(elem, ord)
            ON CONFLICT (id) DO NOTHING;

            -- 4e. Venues
            INSERT INTO venues (id, tipo, titulo, lugar, direccion, hora, map_url, external_link, plataforma, stream_url, codigo_acceso, orden)
            SELECT COALESCE(NULLIF(elem->>'id', ''), 'venue-' || ord::text),
                   COALESCE(NULLIF(elem->>'tipo', ''), 'ceremony'),
                   COALESCE(NULLIF(elem->>'titulo', ''), 'Evento'),
                   elem->>'lugar', elem->>'direccion', elem->>'hora',
                   elem->>'mapUrl', elem->>'externalLink',
                   elem->>'plataforma', elem->>'streamUrl', elem->>'codigoAcceso',
                   (ord - 1)::INT
            FROM jsonb_array_elements(COALESCE(v_cfg.venues, '[]'::jsonb)) WITH ORDINALITY AS t(elem, ord)
            ON CONFLICT (id) DO NOTHING;

            -- 4f. Itinerario
            INSERT INTO itinerario_items (id, hora, titulo, icono, orden)
            SELECT 'it-' || ord::text,
                   COALESCE(NULLIF(elem->>'hora', ''), '00:00'),
                   COALESCE(NULLIF(elem->>'titulo', ''), 'Actividad'),
                   COALESCE(NULLIF(elem->>'icono', ''), 'MapPin'),
                   (ord - 1)::INT
            FROM jsonb_array_elements(COALESCE(v_cfg.itinerario, '[]'::jsonb)) WITH ORDINALITY AS t(elem, ord)
            ON CONFLICT (id) DO NOTHING;

            -- 4g. Datos bancarios
            INSERT INTO datos_bancarios (id, tipo, banco, titular, telefono, cedula, binance_id, orden)
            SELECT 'cta-' || ord::text,
                   CASE WHEN elem->>'tipo' = 'Binance Pay' THEN 'Binance Pay' ELSE 'Pago Móvil' END,
                   COALESCE(NULLIF(elem->>'banco', ''), 'Banco'),
                   COALESCE(NULLIF(elem->>'titular', ''), 'Titular'),
                   elem->>'telefono', elem->>'cedula', elem->>'id',
                   (ord - 1)::INT
            FROM jsonb_array_elements(COALESCE(v_cfg.datos_bancarios, '[]'::jsonb)) WITH ORDINALITY AS t(elem, ord)
            ON CONFLICT (id) DO NOTHING;

            -- 4h. Padrinos
            INSERT INTO padrinos (id, nombre, rol, orden)
            SELECT 'pad-' || ord::text,
                   COALESCE(NULLIF(elem->>'nombre', ''), 'Padrino'),
                   COALESCE(NULLIF(elem->>'rol', ''), 'Padrino'),
                   (ord - 1)::INT
            FROM jsonb_array_elements(COALESCE(v_cfg.padrinos, '[]'::jsonb)) WITH ORDINALITY AS t(elem, ord)
            ON CONFLICT (id) DO NOTHING;
        END IF;
    END IF;
END $$;

-- Asegurar que cualquier grupo usado en `invitados` exista en `grupos` antes de crear la FK
INSERT INTO grupos (id, nombre, color, orden)
SELECT DISTINCT i.grupo, initcap(i.grupo), 'gray', 99
FROM invitados i
WHERE i.grupo IS NOT NULL AND NOT EXISTS (SELECT 1 FROM grupos g WHERE g.id = i.grupo)
ON CONFLICT (id) DO NOTHING;

-- ─── 5. Eliminar las columnas JSONB viejas de `configuracion` ────────
ALTER TABLE configuracion
    DROP COLUMN IF EXISTS novios,
    DROP COLUMN IF EXISTS venues,
    DROP COLUMN IF EXISTS itinerario,
    DROP COLUMN IF EXISTS vestimenta,
    DROP COLUMN IF EXISTS menu,
    DROP COLUMN IF EXISTS datos_bancarios,
    DROP COLUMN IF EXISTS padres,
    DROP COLUMN IF EXISTS padrinos,
    DROP COLUMN IF EXISTS grupos,
    DROP COLUMN IF EXISTS textos;

-- CHECK constraints nativos en columnas escalares de `configuracion`
ALTER TABLE configuracion DROP CONSTRAINT IF EXISTS chk_config_escalares;
ALTER TABLE configuracion ADD CONSTRAINT chk_config_escalares CHECK (
    char_length(btrim(novia_nombre))                 BETWEEN 1 AND 25 AND
    char_length(btrim(novio_nombre))                 BETWEEN 1 AND 25 AND
    char_length(COALESCE(novia_apellido, ''))        <= 30 AND
    char_length(COALESCE(novio_apellido, ''))        <= 30 AND
    char_length(COALESCE(novia_whatsapp, ''))        <= 25 AND
    char_length(COALESCE(novio_whatsapp, ''))        <= 25 AND
    char_length(COALESCE(vestimenta_tipo, ''))       <= 40 AND
    max_contornos                                    BETWEEN 0 AND 6 AND
    char_length(COALESCE(url_publica, ''))           <= 200 AND
    char_length(COALESCE(plantilla_whatsapp, ''))    <= 600 AND
    char_length(COALESCE(padres_novia_padre, ''))    <= 50 AND
    char_length(COALESCE(padres_novia_madre, ''))    <= 50 AND
    char_length(COALESCE(padres_novio_padre, ''))    <= 50 AND
    char_length(COALESCE(padres_novio_madre, ''))    <= 50 AND
    char_length(COALESCE(hero_badge, ''))            <= 30 AND
    char_length(COALESCE(save_the_date_titulo, ''))  <= 30 AND
    char_length(COALESCE(save_the_date_dia_semana, '')) <= 20 AND
    char_length(COALESCE(event_cards_titulo, ''))    <= 35 AND
    char_length(COALESCE(event_cards_subtitulo, '')) <= 160 AND
    char_length(COALESCE(itinerario_titulo, ''))     <= 35 AND
    char_length(COALESCE(rsvp_titulo, ''))           <= 35 AND
    char_length(COALESCE(rsvp_subtitulo, ''))        <= 180 AND
    char_length(COALESCE(regalos_titulo, ''))        <= 35 AND
    char_length(COALESCE(regalos_subtitulo, ''))     <= 180 AND
    char_length(COALESCE(quote_texto, ''))           <= 220 AND
    char_length(COALESCE(quote_firma, ''))           <= 60 AND
    char_length(COALESCE(footer_versiculo, ''))      <= 320 AND
    char_length(COALESCE(footer_referencia, ''))     <= 50 AND
    char_length(COALESCE(overlay_boton, ''))         <= 28
);

-- ─── 6. Clave foránea real invitados.grupo -> grupos(id) ─────────────
ALTER TABLE invitados DROP CONSTRAINT IF EXISTS fk_invitados_grupo;
ALTER TABLE invitados
    ADD CONSTRAINT fk_invitados_grupo
    FOREIGN KEY (grupo) REFERENCES grupos(id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

-- ─── 7. Trigger genérico de mínimo y máximo por tabla hija ───────────
CREATE OR REPLACE FUNCTION public.trg_validar_cantidad_filas()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_min   INT  := TG_ARGV[0]::INT;
    v_max   INT  := TG_ARGV[1]::INT;
    v_label TEXT := TG_ARGV[2];
    v_count INT;
BEGIN
    EXECUTE format('SELECT count(*) FROM %I.%I', TG_TABLE_SCHEMA, TG_TABLE_NAME) INTO v_count;

    IF TG_OP = 'INSERT' AND v_count >= v_max THEN
        RAISE EXCEPTION 'limite_maximo: % no puede tener más de % elemento(s)', v_label, v_max;
    END IF;

    IF TG_OP = 'DELETE' AND v_min > 0 AND v_count <= v_min THEN
        RAISE EXCEPTION 'limite_minimo: % debe tener al menos % elemento(s)', v_label, v_min;
    END IF;

    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END $$;

DROP TRIGGER IF EXISTS trg_grupos_limites ON grupos;
CREATE TRIGGER trg_grupos_limites
    BEFORE INSERT OR DELETE ON grupos
    FOR EACH ROW EXECUTE FUNCTION public.trg_validar_cantidad_filas('1', '6', 'grupos');

DROP TRIGGER IF EXISTS trg_menu_platos_limites ON menu_platos;
CREATE TRIGGER trg_menu_platos_limites
    BEFORE INSERT OR DELETE ON menu_platos
    FOR EACH ROW EXECUTE FUNCTION public.trg_validar_cantidad_filas('1', '8', 'menu_platos');

DROP TRIGGER IF EXISTS trg_menu_contornos_limites ON menu_contornos;
CREATE TRIGGER trg_menu_contornos_limites
    BEFORE INSERT OR DELETE ON menu_contornos
    FOR EACH ROW EXECUTE FUNCTION public.trg_validar_cantidad_filas('0', '10', 'menu_contornos');

DROP TRIGGER IF EXISTS trg_venues_limites ON venues;
CREATE TRIGGER trg_venues_limites
    BEFORE INSERT OR DELETE ON venues
    FOR EACH ROW EXECUTE FUNCTION public.trg_validar_cantidad_filas('1', '4', 'venues');

DROP TRIGGER IF EXISTS trg_itinerario_limites ON itinerario_items;
CREATE TRIGGER trg_itinerario_limites
    BEFORE INSERT OR DELETE ON itinerario_items
    FOR EACH ROW EXECUTE FUNCTION public.trg_validar_cantidad_filas('0', '8', 'itinerario_items');

DROP TRIGGER IF EXISTS trg_datos_bancarios_limites ON datos_bancarios;
CREATE TRIGGER trg_datos_bancarios_limites
    BEFORE INSERT OR DELETE ON datos_bancarios
    FOR EACH ROW EXECUTE FUNCTION public.trg_validar_cantidad_filas('0', '6', 'datos_bancarios');

DROP TRIGGER IF EXISTS trg_padrinos_limites ON padrinos;
CREATE TRIGGER trg_padrinos_limites
    BEFORE INSERT OR DELETE ON padrinos
    FOR EACH ROW EXECUTE FUNCTION public.trg_validar_cantidad_filas('0', '6', 'padrinos');

-- ─── 8. Permisos y RLS restrictiva en las 7 tablas nuevas ────────────
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['grupos','menu_platos','menu_contornos','venues','itinerario_items','datos_bancarios','padrinos'] LOOP
        EXECUTE format('REVOKE ALL ON TABLE %I FROM anon', t);
        EXECUTE format('GRANT SELECT ON TABLE %I TO anon', t);
        EXECUTE format('GRANT ALL ON TABLE %I TO authenticated, service_role', t);
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Lectura publica" ON %I', t);
        EXECUTE format('CREATE POLICY "Lectura publica" ON %I FOR SELECT TO anon, authenticated USING (TRUE)', t);
        EXECUTE format('DROP POLICY IF EXISTS "Novios administran" ON %I', t);
        EXECUTE format('CREATE POLICY "Novios administran" ON %I FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE)', t);
    END LOOP;
END $$;

-- ─── 9. Actualizar RPC confirmar_asistencia (lee tablas relacionales) ─
CREATE OR REPLACE FUNCTION public.confirmar_asistencia(p_token UUID, p_asistentes JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_inv           invitados;
    v_max_cont      INT;
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

    SELECT COALESCE(max_contornos, 2) INTO v_max_cont FROM configuracion WHERE id = 'default';

    FOR a IN SELECT * FROM jsonb_array_elements(p_asistentes) LOOP
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

        IF NOT EXISTS (SELECT 1 FROM menu_platos WHERE id = a->>'plato_fuerte') THEN
            RAISE EXCEPTION 'plato_invalido';
        END IF;

        v_cont := COALESCE(a->'contornos', '[]'::jsonb);
        IF jsonb_array_length(v_cont) > v_max_cont THEN
            RAISE EXCEPTION 'demasiados_contornos';
        END IF;
        IF EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(v_cont) c
            WHERE NOT EXISTS (SELECT 1 FROM menu_contornos mc WHERE mc.id = c)
        ) THEN
            RAISE EXCEPTION 'contorno_invalido';
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

-- ─── 10. Comentarios de referencia en el Dashboard de Supabase ───────
COMMENT ON TABLE grupos           IS 'Grupos de invitados (min 1, max 6; referenciado por invitados.grupo)';
COMMENT ON TABLE menu_platos      IS 'Platos fuertes del menú (min 1, max 8; nombre <=55 chars)';
COMMENT ON TABLE menu_contornos   IS 'Contornos/guarniciones del menú (min 0, max 10; nombre <=40 chars)';
COMMENT ON TABLE venues           IS 'Ubicaciones físicas y transmisiones/videollamadas (min 1, max 4)';
COMMENT ON TABLE itinerario_items IS 'Pasos del itinerario (min 0, max 8; si 0 se oculta la sección)';
COMMENT ON TABLE datos_bancarios  IS 'Cuentas de mesa de regalos (min 0, max 6; si 0 se oculta la tarjeta)';
COMMENT ON TABLE padrinos         IS 'Padrinos y madrinas (min 0, max 6)';
COMMENT ON COLUMN configuracion.novia_nombre    IS 'Nombre de la novia (1..25 chars)';
COMMENT ON COLUMN configuracion.novio_nombre    IS 'Nombre del novio (1..25 chars)';
COMMENT ON COLUMN configuracion.vestimenta_tipo IS 'Código de vestimenta (<=40 chars; si vacío se oculta la tarjeta)';
COMMENT ON COLUMN configuracion.max_contornos   IS 'Máximo de contornos por persona (0..6)';
