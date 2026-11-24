-- ============================================================
-- Migración 007 — Blindaje de integridad visual (Mobile-First)
-- Ejecutar en: Supabase Dashboard → SQL Editor
--
-- Impone directamente en PostgreSQL los límites de elementos y
-- longitudes de texto para que ni siquiera editando desde el
-- dashboard de Supabase se pueda romper el diseño en móvil o web.
-- ============================================================

-- ─── 1. CHECK constraints en `invitados` y `confirmaciones` ─────────
ALTER TABLE invitados DROP CONSTRAINT IF EXISTS chk_invitados_longitudes;
ALTER TABLE invitados ADD CONSTRAINT chk_invitados_longitudes CHECK (
    char_length(btrim(nombre))   BETWEEN 1 AND 40 AND
    char_length(btrim(apellido)) BETWEEN 1 AND 40 AND
    char_length(btrim(COALESCE(telefono, ''))) <= 25 AND
    char_length(btrim(COALESCE(email, '')))    <= 100 AND
    char_length(btrim(grupo))    BETWEEN 1 AND 40 AND
    slots_totales                BETWEEN 0 AND 15
) NOT VALID;

ALTER TABLE confirmaciones DROP CONSTRAINT IF EXISTS chk_confirmaciones_longitudes;
ALTER TABLE confirmaciones ADD CONSTRAINT chk_confirmaciones_longitudes CHECK (
    char_length(btrim(nombre_completo)) BETWEEN 1 AND 85 AND
    (nombre   IS NULL OR char_length(btrim(nombre))   BETWEEN 1 AND 40) AND
    (apellido IS NULL OR char_length(btrim(apellido)) BETWEEN 1 AND 40)
) NOT VALID;

-- ─── 2. CHECK constraints en `configuracion` (arrays JSONB y textos) ─
ALTER TABLE configuracion DROP CONSTRAINT IF EXISTS chk_config_limites_arrays;
ALTER TABLE configuracion ADD CONSTRAINT chk_config_limites_arrays CHECK (
    jsonb_typeof(venues) = 'array'          AND jsonb_array_length(venues)          BETWEEN 1 AND 4 AND
    jsonb_typeof(itinerario) = 'array'      AND jsonb_array_length(itinerario)      BETWEEN 0 AND 8 AND
    jsonb_typeof(datos_bancarios) = 'array' AND jsonb_array_length(datos_bancarios) BETWEEN 0 AND 6 AND
    jsonb_typeof(padrinos) = 'array'        AND jsonb_array_length(padrinos)        BETWEEN 0 AND 6 AND
    jsonb_typeof(grupos) = 'array'          AND jsonb_array_length(grupos)          BETWEEN 1 AND 6 AND
    jsonb_typeof(menu->'platosFuertes') = 'array'
        AND jsonb_array_length(menu->'platosFuertes') BETWEEN 1 AND 8 AND
    jsonb_typeof(menu->'contornos') = 'array'
        AND jsonb_array_length(menu->'contornos')     BETWEEN 0 AND 10 AND
    COALESCE((menu->>'maxContornos')::INT, 2)         BETWEEN 0 AND 6 AND
    char_length(COALESCE(url_publica, ''))            <= 200 AND
    char_length(COALESCE(plantilla_whatsapp, ''))     <= 600
) NOT VALID;

-- ─── 3. Trigger de validación detallada de longitudes dentro de JSONB ─
CREATE OR REPLACE FUNCTION public.trg_configuracion_validar_limites()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    elem JSONB;
BEGIN
    -- Novios
    IF char_length(btrim(COALESCE(NEW.novios->'novia'->>'nombre', ''))) NOT BETWEEN 1 AND 25 THEN
        RAISE EXCEPTION 'novios.novia.nombre debe tener entre 1 y 25 caracteres';
    END IF;
    IF char_length(btrim(COALESCE(NEW.novios->'novio'->>'nombre', ''))) NOT BETWEEN 1 AND 25 THEN
        RAISE EXCEPTION 'novios.novio.nombre debe tener entre 1 y 25 caracteres';
    END IF;
    IF char_length(COALESCE(NEW.novios->'novia'->>'apellido', '')) > 30
       OR char_length(COALESCE(NEW.novios->'novio'->>'apellido', '')) > 30 THEN
        RAISE EXCEPTION 'Los apellidos de los novios no pueden superar 30 caracteres';
    END IF;

    -- Vestimenta
    IF char_length(COALESCE(NEW.vestimenta->>'tipo', '')) > 40 THEN
        RAISE EXCEPTION 'vestimenta.tipo no puede superar 40 caracteres';
    END IF;

    -- Venues / Eventos (1..4)
    FOR elem IN SELECT * FROM jsonb_array_elements(COALESCE(NEW.venues, '[]'::jsonb)) LOOP
        IF char_length(COALESCE(elem->>'titulo', '')) > 40 THEN
            RAISE EXCEPTION 'venues[].titulo no puede superar 40 caracteres';
        END IF;
        IF char_length(COALESCE(elem->>'lugar', '')) > 60
           OR char_length(COALESCE(elem->>'plataforma', '')) > 60 THEN
            RAISE EXCEPTION 'venues[].lugar/plataforma no puede superar 60 caracteres';
        END IF;
        IF char_length(COALESCE(elem->>'direccion', '')) > 120
           OR char_length(COALESCE(elem->>'codigoAcceso', '')) > 120 THEN
            RAISE EXCEPTION 'venues[].direccion/codigoAcceso no puede superar 120 caracteres';
        END IF;
        IF char_length(COALESCE(elem->>'hora', '')) > 25 THEN
            RAISE EXCEPTION 'venues[].hora no puede superar 25 caracteres';
        END IF;
    END LOOP;

    -- Itinerario (0..8)
    FOR elem IN SELECT * FROM jsonb_array_elements(COALESCE(NEW.itinerario, '[]'::jsonb)) LOOP
        IF char_length(COALESCE(elem->>'hora', '')) > 15 THEN
            RAISE EXCEPTION 'itinerario[].hora no puede superar 15 caracteres';
        END IF;
        IF char_length(COALESCE(elem->>'titulo', '')) > 55 THEN
            RAISE EXCEPTION 'itinerario[].titulo no puede superar 55 caracteres';
        END IF;
    END LOOP;

    -- Menú: platosFuertes (1..8) y contornos (0..10)
    FOR elem IN SELECT * FROM jsonb_array_elements(COALESCE(NEW.menu->'platosFuertes', '[]'::jsonb)) LOOP
        IF char_length(btrim(COALESCE(elem->>'nombre', ''))) NOT BETWEEN 1 AND 55 THEN
            RAISE EXCEPTION 'menu.platosFuertes[].nombre debe tener entre 1 y 55 caracteres';
        END IF;
    END LOOP;
    FOR elem IN SELECT * FROM jsonb_array_elements(COALESCE(NEW.menu->'contornos', '[]'::jsonb)) LOOP
        IF char_length(btrim(COALESCE(elem->>'nombre', ''))) NOT BETWEEN 1 AND 40 THEN
            RAISE EXCEPTION 'menu.contornos[].nombre debe tener entre 1 y 40 caracteres';
        END IF;
    END LOOP;

    -- Grupos (1..6)
    FOR elem IN SELECT * FROM jsonb_array_elements(COALESCE(NEW.grupos, '[]'::jsonb)) LOOP
        IF char_length(btrim(COALESCE(elem->>'nombre', ''))) NOT BETWEEN 1 AND 30 THEN
            RAISE EXCEPTION 'grupos[].nombre debe tener entre 1 y 30 caracteres';
        END IF;
    END LOOP;

    -- Datos bancarios (0..6)
    FOR elem IN SELECT * FROM jsonb_array_elements(COALESCE(NEW.datos_bancarios, '[]'::jsonb)) LOOP
        IF char_length(COALESCE(elem->>'banco', '')) > 35 THEN
            RAISE EXCEPTION 'datos_bancarios[].banco no puede superar 35 caracteres';
        END IF;
        IF char_length(COALESCE(elem->>'titular', '')) > 50 THEN
            RAISE EXCEPTION 'datos_bancarios[].titular no puede superar 50 caracteres';
        END IF;
        IF char_length(COALESCE(elem->>'telefono', '')) > 35
           OR char_length(COALESCE(elem->>'cedula', '')) > 35
           OR char_length(COALESCE(elem->>'id', '')) > 35 THEN
            RAISE EXCEPTION 'Los datos de cuenta en datos_bancarios no pueden superar 35 caracteres';
        END IF;
    END LOOP;

    -- Padres y Padrinos
    IF char_length(COALESCE(NEW.padres->'novia'->>'padre', '')) > 50
       OR char_length(COALESCE(NEW.padres->'novia'->>'madre', '')) > 50
       OR char_length(COALESCE(NEW.padres->'novio'->>'padre', '')) > 50
       OR char_length(COALESCE(NEW.padres->'novio'->>'madre', '')) > 50 THEN
        RAISE EXCEPTION 'Los nombres de los padres no pueden superar 50 caracteres';
    END IF;
    FOR elem IN SELECT * FROM jsonb_array_elements(COALESCE(NEW.padrinos, '[]'::jsonb)) LOOP
        IF char_length(COALESCE(elem->>'nombre', '')) > 50 THEN
            RAISE EXCEPTION 'padrinos[].nombre no puede superar 50 caracteres';
        END IF;
        IF char_length(COALESCE(elem->>'rol', '')) > 30 THEN
            RAISE EXCEPTION 'padrinos[].rol no puede superar 30 caracteres';
        END IF;
    END LOOP;

    -- Textos de la tarjeta
    IF char_length(COALESCE(NEW.textos->'hero'->>'badge', '')) > 30 THEN
        RAISE EXCEPTION 'textos.hero.badge no puede superar 30 caracteres';
    END IF;
    IF char_length(COALESCE(NEW.textos->'saveTheDate'->>'titulo', '')) > 30
       OR char_length(COALESCE(NEW.textos->'saveTheDate'->>'diaSemana', '')) > 20 THEN
        RAISE EXCEPTION 'textos.saveTheDate excede la longitud permitida (titulo <= 30, diaSemana <= 20)';
    END IF;
    IF char_length(COALESCE(NEW.textos->'eventCards'->>'titulo', '')) > 35
       OR char_length(COALESCE(NEW.textos->'eventCards'->>'subtitulo', '')) > 160 THEN
        RAISE EXCEPTION 'textos.eventCards excede la longitud permitida (titulo <= 35, subtitulo <= 160)';
    END IF;
    IF char_length(COALESCE(NEW.textos->'itinerario'->>'titulo', '')) > 35 THEN
        RAISE EXCEPTION 'textos.itinerario.titulo no puede superar 35 caracteres';
    END IF;
    IF char_length(COALESCE(NEW.textos->'rsvp'->>'titulo', '')) > 35
       OR char_length(COALESCE(NEW.textos->'rsvp'->>'subtitulo', '')) > 180 THEN
        RAISE EXCEPTION 'textos.rsvp excede la longitud permitida (titulo <= 35, subtitulo <= 180)';
    END IF;
    IF char_length(COALESCE(NEW.textos->'regalos'->>'titulo', '')) > 35
       OR char_length(COALESCE(NEW.textos->'regalos'->>'subtitulo', '')) > 180 THEN
        RAISE EXCEPTION 'textos.regalos excede la longitud permitida (titulo <= 35, subtitulo <= 180)';
    END IF;
    IF char_length(COALESCE(NEW.textos->'quote'->>'texto', '')) > 220
       OR char_length(COALESCE(NEW.textos->'quote'->>'firma', '')) > 60 THEN
        RAISE EXCEPTION 'textos.quote excede la longitud permitida (texto <= 220, firma <= 60)';
    END IF;
    IF char_length(COALESCE(NEW.textos->'footer'->>'versiculo', '')) > 320
       OR char_length(COALESCE(NEW.textos->'footer'->>'referencia', '')) > 50 THEN
        RAISE EXCEPTION 'textos.footer excede la longitud permitida (versiculo <= 320, referencia <= 50)';
    END IF;
    IF char_length(COALESCE(NEW.textos->'overlay'->>'boton', '')) > 28 THEN
        RAISE EXCEPTION 'textos.overlay.boton no puede superar 28 caracteres';
    END IF;

    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS configuracion_validar_limites ON configuracion;
CREATE TRIGGER configuracion_validar_limites
    BEFORE INSERT OR UPDATE ON configuracion
    FOR EACH ROW EXECUTE FUNCTION public.trg_configuracion_validar_limites();

-- ─── 4. Trigger de límite máximo de fotos en la galería ─────────────
CREATE OR REPLACE FUNCTION public.trg_fotos_limite_maximo()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_total INT;
BEGIN
    SELECT count(*) INTO v_total FROM fotos;
    IF v_total >= 120 THEN
        RAISE EXCEPTION 'galeria_llena: se alcanzó el límite máximo de 120 fotos para este evento';
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS fotos_limite_maximo ON fotos;
CREATE TRIGGER fotos_limite_maximo
    BEFORE INSERT ON fotos
    FOR EACH ROW EXECUTE FUNCTION public.trg_fotos_limite_maximo();

-- ─── 5. Comentarios de referencia visual en el Dashboard de Supabase ─
COMMENT ON COLUMN configuracion.novios             IS 'JSONB: novia/novio {nombre <=25, apellido <=30, whatsapp}';
COMMENT ON COLUMN configuracion.venues             IS 'JSONB array (min 1, max 4): {tipo, titulo <=40, lugar/plataforma <=60, direccion/codigoAcceso <=120, hora <=25}';
COMMENT ON COLUMN configuracion.itinerario         IS 'JSONB array (min 0, max 8; si 0 se oculta): {hora <=15, titulo <=55, icono}';
COMMENT ON COLUMN configuracion.vestimenta         IS 'JSONB: {tipo <=40; si vacío se oculta la tarjeta}';
COMMENT ON COLUMN configuracion.menu               IS 'JSONB: platosFuertes (1..8, nombre <=55), contornos (0..10, nombre <=40), maxContornos (0..6)';
COMMENT ON COLUMN configuracion.datos_bancarios    IS 'JSONB array (min 0, max 6; si 0 se oculta Mesa de Regalos): {banco <=35, titular <=50, datos <=35}';
COMMENT ON COLUMN configuracion.padres             IS 'JSONB opcional: novia/novio {padre <=50, madre <=50}';
COMMENT ON COLUMN configuracion.padrinos           IS 'JSONB array (min 0, max 6): {nombre <=50, rol <=30}';
COMMENT ON COLUMN configuracion.grupos             IS 'JSONB array (min 1, max 6): {id, nombre <=30, color, whatsapp}';
COMMENT ON COLUMN configuracion.textos             IS 'JSONB: hero.badge <=30, quote.texto <=220, quote.firma <=60, footer.versiculo <=320, footer.referencia <=50';
COMMENT ON COLUMN configuracion.url_publica        IS 'URL pública para enlaces de WhatsApp (<=200 chars)';
COMMENT ON COLUMN configuracion.plantilla_whatsapp IS 'Plantilla de invitación WhatsApp (<=600 chars)';
COMMENT ON COLUMN invitados.slots_totales          IS 'Acompañantes adicionales permitidos (+N, rango 0..15). Capacidad total = 1 + slots_totales';
COMMENT ON TABLE  fotos                            IS 'Fotos subidas por invitados (máx 120 registros por evento; preview muestra 6 y visor hasta 60 aprobadas)';
