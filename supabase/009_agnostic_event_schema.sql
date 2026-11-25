-- ============================================================
-- Migration 009 — Agnostic Event Management Schema (English)
-- Execute in: Supabase Dashboard → SQL Editor
--
-- Transforms the schema into a 100% event-agnostic, English-named
-- relational architecture while preserving 100% of existing data.
-- ============================================================

-- ─── 1. Drop legacy triggers, constraints, policies and functions ───
DROP TRIGGER IF EXISTS confirmaciones_before_insert ON confirmaciones;
DROP TRIGGER IF EXISTS confirmaciones_after_insert  ON confirmaciones;
DROP TRIGGER IF EXISTS confirmaciones_after_delete  ON confirmaciones;
DROP TRIGGER IF EXISTS invitados_before_update      ON invitados;
DROP TRIGGER IF EXISTS fotos_limite_maximo          ON fotos;

DROP TRIGGER IF EXISTS trg_grupos_limites          ON grupos;
DROP TRIGGER IF EXISTS trg_menu_platos_limites     ON menu_platos;
DROP TRIGGER IF EXISTS trg_menu_contornos_limites  ON menu_contornos;
DROP TRIGGER IF EXISTS trg_venues_limites          ON venues;
DROP TRIGGER IF EXISTS trg_itinerario_limites      ON itinerario_items;
DROP TRIGGER IF EXISTS trg_datos_bancarios_limites ON datos_bancarios;
DROP TRIGGER IF EXISTS trg_padrinos_limites        ON padrinos;

DROP FUNCTION IF EXISTS public.obtener_invitado(UUID);
DROP FUNCTION IF EXISTS public.obtener_confirmaciones_invitado(UUID);
DROP FUNCTION IF EXISTS public.confirmar_asistencia(UUID, JSONB);
DROP FUNCTION IF EXISTS public.reiniciar_confirmacion(UUID);
DROP FUNCTION IF EXISTS public.galeria_publica();
DROP FUNCTION IF EXISTS public.puede_subir_fotos(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.trg_confirmaciones_before_insert();
DROP FUNCTION IF EXISTS public.trg_confirmaciones_after_insert();
DROP FUNCTION IF EXISTS public.trg_confirmaciones_after_delete();
DROP FUNCTION IF EXISTS public.trg_invitados_before_update();
DROP FUNCTION IF EXISTS public.trg_fotos_limite_maximo();
DROP FUNCTION IF EXISTS public.trg_validar_cantidad_filas();

-- ─── 2. Rename tables to English agnostic names ─────────────────────
ALTER TABLE IF EXISTS configuracion    RENAME TO event_settings;
ALTER TABLE IF EXISTS grupos           RENAME TO guest_groups;
ALTER TABLE IF EXISTS invitados        RENAME TO guests;
ALTER TABLE IF EXISTS confirmaciones   RENAME TO rsvp_attendees;
ALTER TABLE IF EXISTS fotos            RENAME TO gallery_photos;
ALTER TABLE IF EXISTS venues           RENAME TO event_locations;
ALTER TABLE IF EXISTS itinerario_items RENAME TO schedule_items;
ALTER TABLE IF EXISTS menu_platos      RENAME TO menu_main_courses;
ALTER TABLE IF EXISTS menu_contornos   RENAME TO menu_sides;
ALTER TABLE IF EXISTS datos_bancarios  RENAME TO payment_accounts;
ALTER TABLE IF EXISTS padrinos         RENAME TO special_mentions;

-- ─── 3. Rename columns & upgrade constraints per table ──────────────

-- 3.1 event_settings
ALTER TABLE event_settings DROP CONSTRAINT IF EXISTS chk_config_escalares;

ALTER TABLE event_settings RENAME COLUMN novio_nombre             TO primary_host_first_name;
ALTER TABLE event_settings RENAME COLUMN novio_apellido           TO primary_host_last_name;
ALTER TABLE event_settings RENAME COLUMN novio_whatsapp           TO primary_host_phone;
ALTER TABLE event_settings RENAME COLUMN novia_nombre             TO secondary_host_first_name;
ALTER TABLE event_settings RENAME COLUMN novia_apellido           TO secondary_host_last_name;
ALTER TABLE event_settings RENAME COLUMN novia_whatsapp           TO secondary_host_phone;
ALTER TABLE event_settings RENAME COLUMN fecha                    TO event_date;
ALTER TABLE event_settings RENAME COLUMN fecha_limite_rsvp        TO rsvp_deadline;
ALTER TABLE event_settings RENAME COLUMN vestimenta_tipo          TO dress_code;
ALTER TABLE event_settings RENAME COLUMN max_contornos            TO max_sides;
ALTER TABLE event_settings RENAME COLUMN url_publica              TO public_url;
ALTER TABLE event_settings RENAME COLUMN plantilla_whatsapp       TO whatsapp_template;
ALTER TABLE event_settings RENAME COLUMN padres_novia_padre       TO group_a_member_1;
ALTER TABLE event_settings RENAME COLUMN padres_novia_madre       TO group_a_member_2;
ALTER TABLE event_settings RENAME COLUMN padres_novio_padre       TO group_b_member_1;
ALTER TABLE event_settings RENAME COLUMN padres_novio_madre       TO group_b_member_2;
ALTER TABLE event_settings RENAME COLUMN save_the_date_titulo     TO date_section_title;
ALTER TABLE event_settings RENAME COLUMN save_the_date_dia_semana TO date_weekday_label;
ALTER TABLE event_settings RENAME COLUMN event_cards_titulo       TO locations_title;
ALTER TABLE event_settings RENAME COLUMN event_cards_subtitulo    TO locations_subtitle;
ALTER TABLE event_settings RENAME COLUMN itinerario_titulo        TO schedule_title;
ALTER TABLE event_settings RENAME COLUMN rsvp_titulo              TO rsvp_title;
ALTER TABLE event_settings RENAME COLUMN rsvp_subtitulo           TO rsvp_subtitle;
ALTER TABLE event_settings RENAME COLUMN regalos_titulo           TO contributions_title;
ALTER TABLE event_settings RENAME COLUMN regalos_subtitulo        TO contributions_subtitle;
ALTER TABLE event_settings RENAME COLUMN quote_texto              TO closing_quote;
ALTER TABLE event_settings RENAME COLUMN quote_firma              TO closing_signature;
ALTER TABLE event_settings RENAME COLUMN footer_versiculo         TO footer_note;
ALTER TABLE event_settings RENAME COLUMN footer_referencia        TO footer_reference;
ALTER TABLE event_settings RENAME COLUMN overlay_boton            TO welcome_button_label;

-- Allow secondary host to be optional (for 1-host events like birthdays or corporate events)
ALTER TABLE event_settings ALTER COLUMN secondary_host_first_name DROP NOT NULL;
ALTER TABLE event_settings ALTER COLUMN secondary_host_first_name DROP DEFAULT;
ALTER TABLE event_settings ALTER COLUMN primary_host_first_name   SET DEFAULT 'Organizador';

-- New tone & dynamic copy columns in event_settings
ALTER TABLE event_settings
    ADD COLUMN IF NOT EXISTS event_type                    TEXT NOT NULL DEFAULT 'wedding'
        CHECK (event_type IN ('wedding', 'birthday', 'gala', 'corporate', 'anniversary', 'graduation', 'casual', 'custom')),
    ADD COLUMN IF NOT EXISTS rsvp_group_prompt             TEXT DEFAULT '¿De parte de quién nos acompañas?',
    ADD COLUMN IF NOT EXISTS rsvp_whatsapp_intro           TEXT DEFAULT '¡Hola! Confirmo asistencia a la boda de {hosts} 💍',
    ADD COLUMN IF NOT EXISTS calendar_title_template       TEXT DEFAULT 'Boda {hosts}',
    ADD COLUMN IF NOT EXISTS calendar_description_template TEXT DEFAULT 'Acompáñanos a celebrar en {venue}.',
    ADD COLUMN IF NOT EXISTS story_badge                   TEXT DEFAULT '¡NOS CASAMOS!',
    ADD COLUMN IF NOT EXISTS story_footer                  TEXT DEFAULT '"Acompáñanos a celebrar nuestro gran día"',
    ADD COLUMN IF NOT EXISTS mentions_section_title        TEXT DEFAULT 'Con la bendición de',
    ADD COLUMN IF NOT EXISTS special_mentions_title        TEXT DEFAULT 'Nuestros Padrinos',
    ADD COLUMN IF NOT EXISTS group_a_label                 TEXT DEFAULT 'Familia de la Novia',
    ADD COLUMN IF NOT EXISTS group_b_label                 TEXT DEFAULT 'Familia del Novio';

ALTER TABLE event_settings ADD CONSTRAINT chk_event_settings_lengths CHECK (
    char_length(btrim(primary_host_first_name))                BETWEEN 1 AND 25 AND
    char_length(COALESCE(btrim(secondary_host_first_name), '')) <= 25 AND
    char_length(COALESCE(primary_host_last_name, ''))          <= 30 AND
    char_length(COALESCE(secondary_host_last_name, ''))        <= 30 AND
    char_length(COALESCE(primary_host_phone, ''))              <= 25 AND
    char_length(COALESCE(secondary_host_phone, ''))            <= 25 AND
    char_length(COALESCE(dress_code, ''))                      <= 40 AND
    max_sides                                                  BETWEEN 0 AND 6 AND
    char_length(COALESCE(public_url, ''))                      <= 200 AND
    char_length(COALESCE(whatsapp_template, ''))               <= 600 AND
    char_length(COALESCE(rsvp_group_prompt, ''))               <= 80 AND
    char_length(COALESCE(rsvp_whatsapp_intro, ''))             <= 160 AND
    char_length(COALESCE(calendar_title_template, ''))         <= 80 AND
    char_length(COALESCE(calendar_description_template, ''))   <= 200 AND
    char_length(COALESCE(story_badge, ''))                     <= 40 AND
    char_length(COALESCE(story_footer, ''))                    <= 90 AND
    char_length(COALESCE(mentions_section_title, ''))          <= 45 AND
    char_length(COALESCE(special_mentions_title, ''))          <= 45 AND
    char_length(COALESCE(group_a_label, ''))                   <= 40 AND
    char_length(COALESCE(group_b_label, ''))                   <= 40 AND
    char_length(COALESCE(group_a_member_1, ''))                <= 50 AND
    char_length(COALESCE(group_a_member_2, ''))                <= 50 AND
    char_length(COALESCE(group_b_member_1, ''))                <= 50 AND
    char_length(COALESCE(group_b_member_2, ''))                <= 50 AND
    char_length(COALESCE(hero_badge, ''))                      <= 30 AND
    char_length(COALESCE(date_section_title, ''))              <= 30 AND
    char_length(COALESCE(date_weekday_label, ''))              <= 20 AND
    char_length(COALESCE(locations_title, ''))                 <= 35 AND
    char_length(COALESCE(locations_subtitle, ''))              <= 160 AND
    char_length(COALESCE(schedule_title, ''))                  <= 35 AND
    char_length(COALESCE(rsvp_title, ''))                      <= 35 AND
    char_length(COALESCE(rsvp_subtitle, ''))                   <= 180 AND
    char_length(COALESCE(contributions_title, ''))             <= 35 AND
    char_length(COALESCE(contributions_subtitle, ''))          <= 180 AND
    char_length(COALESCE(closing_quote, ''))                   <= 220 AND
    char_length(COALESCE(closing_signature, ''))               <= 60 AND
    char_length(COALESCE(footer_note, ''))                     <= 320 AND
    char_length(COALESCE(footer_reference, ''))                <= 50 AND
    char_length(COALESCE(welcome_button_label, ''))            <= 28
);

-- 3.2 guest_groups
ALTER TABLE guest_groups RENAME COLUMN nombre   TO name;
ALTER TABLE guest_groups RENAME COLUMN whatsapp TO contact_phone;
ALTER TABLE guest_groups RENAME COLUMN orden    TO sort_order;
ALTER TABLE guest_groups ADD COLUMN IF NOT EXISTS icon_key TEXT NOT NULL DEFAULT 'Users'
    CHECK (char_length(btrim(icon_key)) BETWEEN 1 AND 30);

-- Preserve original illustrations for existing wedding groups if present
UPDATE guest_groups SET icon_key = 'dress' WHERE id = 'novia' AND icon_key = 'Users';
UPDATE guest_groups SET icon_key = 'shirt' WHERE id = 'novio' AND icon_key = 'Users';

-- 3.3 guests
ALTER TABLE guests DROP CONSTRAINT IF EXISTS chk_invitados_longitudes;
ALTER TABLE guests DROP CONSTRAINT IF EXISTS invitados_datos_minimos;
ALTER TABLE guests DROP CONSTRAINT IF EXISTS invitados_slots_totales_nonneg;
ALTER TABLE guests DROP CONSTRAINT IF EXISTS invitados_grupo_no_vacio;
ALTER TABLE guests DROP CONSTRAINT IF EXISTS fk_invitados_grupo;

ALTER TABLE guests RENAME COLUMN token             TO access_token;
ALTER TABLE guests RENAME COLUMN nombre            TO first_name;
ALTER TABLE guests RENAME COLUMN apellido          TO last_name;
ALTER TABLE guests RENAME COLUMN telefono          TO phone;
ALTER TABLE guests RENAME COLUMN grupo             TO group_id;
ALTER TABLE guests RENAME COLUMN slots_totales     TO extra_passes;
ALTER TABLE guests RENAME COLUMN puede_subir_fotos TO can_upload_photos;

ALTER INDEX IF EXISTS idx_invitados_token RENAME TO idx_guests_access_token;

ALTER TABLE guests ADD CONSTRAINT fk_guests_group
    FOREIGN KEY (group_id) REFERENCES guest_groups(id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE guests ADD CONSTRAINT chk_guests_bounds CHECK (
    char_length(btrim(first_name))          BETWEEN 1 AND 40 AND
    char_length(btrim(last_name))           BETWEEN 1 AND 40 AND
    char_length(btrim(COALESCE(phone, ''))) BETWEEN 1 AND 25 AND
    char_length(btrim(COALESCE(email, ''))) <= 100 AND
    char_length(btrim(group_id))            BETWEEN 1 AND 40 AND
    extra_passes                            BETWEEN 0 AND 15
) NOT VALID;

-- 3.4 rsvp_attendees
ALTER TABLE rsvp_attendees DROP CONSTRAINT IF EXISTS chk_confirmaciones_longitudes;
DROP INDEX IF EXISTS uq_confirmaciones_titular;
ALTER INDEX IF EXISTS idx_confirmaciones_inv RENAME TO idx_rsvp_attendees_guest;

ALTER TABLE rsvp_attendees RENAME COLUMN invitado_id     TO guest_id;
ALTER TABLE rsvp_attendees RENAME COLUMN nombre          TO first_name;
ALTER TABLE rsvp_attendees RENAME COLUMN apellido        TO last_name;
ALTER TABLE rsvp_attendees RENAME COLUMN nombre_completo TO full_name;
ALTER TABLE rsvp_attendees RENAME COLUMN es_titular      TO is_primary;
ALTER TABLE rsvp_attendees RENAME COLUMN plato_fuerte    TO main_course_id;
ALTER TABLE rsvp_attendees RENAME COLUMN contornos       TO side_ids;
ALTER TABLE rsvp_attendees RENAME COLUMN regalo_id       TO gift_option_id;

CREATE UNIQUE INDEX IF NOT EXISTS uq_rsvp_attendees_primary
    ON rsvp_attendees (guest_id) WHERE is_primary;

ALTER TABLE rsvp_attendees ADD CONSTRAINT chk_rsvp_attendees_lengths CHECK (
    char_length(btrim(full_name)) BETWEEN 1 AND 85 AND
    (first_name IS NULL OR char_length(btrim(first_name)) BETWEEN 1 AND 40) AND
    (last_name  IS NULL OR char_length(btrim(last_name))  BETWEEN 1 AND 40)
) NOT VALID;

-- 3.5 gallery_photos
ALTER INDEX IF EXISTS idx_fotos_estado RENAME TO idx_gallery_photos_status;
ALTER INDEX IF EXISTS idx_fotos_inv    RENAME TO idx_gallery_photos_guest;

DO $$
DECLARE
    v_con TEXT;
BEGIN
    FOR v_con IN
        SELECT conname FROM pg_constraint
        WHERE conrelid = 'public.gallery_photos'::regclass AND contype = 'c'
    LOOP
        EXECUTE format('ALTER TABLE public.gallery_photos DROP CONSTRAINT %I', v_con);
    END LOOP;
END $$;

ALTER TABLE gallery_photos RENAME COLUMN invitado_id TO guest_id;
ALTER TABLE gallery_photos RENAME COLUMN estado      TO status;
ALTER TABLE gallery_photos ALTER COLUMN status SET DEFAULT 'pending';

UPDATE gallery_photos SET status = 'pending'  WHERE status = 'pendiente';
UPDATE gallery_photos SET status = 'approved' WHERE status = 'aprobada';
UPDATE gallery_photos SET status = 'rejected' WHERE status = 'rechazada';

ALTER TABLE gallery_photos ADD CONSTRAINT chk_gallery_photos_status
    CHECK (status IN ('pending', 'approved', 'rejected'));

-- 3.6 event_locations
DO $$
DECLARE
    v_con TEXT;
BEGIN
    FOR v_con IN
        SELECT conname FROM pg_constraint
        WHERE conrelid = 'public.event_locations'::regclass AND contype = 'c'
          AND pg_get_constraintdef(oid) ILIKE '%ceremony%'
    LOOP
        EXECUTE format('ALTER TABLE public.event_locations DROP CONSTRAINT %I', v_con);
    END LOOP;
END $$;

ALTER TABLE event_locations RENAME COLUMN tipo          TO location_type;
ALTER TABLE event_locations RENAME COLUMN titulo        TO title;
ALTER TABLE event_locations RENAME COLUMN lugar         TO venue_name;
ALTER TABLE event_locations RENAME COLUMN direccion     TO address;
ALTER TABLE event_locations RENAME COLUMN hora          TO time_label;
ALTER TABLE event_locations RENAME COLUMN plataforma    TO platform;
ALTER TABLE event_locations RENAME COLUMN codigo_acceso TO access_code;
ALTER TABLE event_locations RENAME COLUMN orden         TO sort_order;

ALTER TABLE event_locations ALTER COLUMN location_type SET DEFAULT 'main_venue';
UPDATE event_locations SET location_type = 'main_venue' WHERE location_type = 'ceremony';
UPDATE event_locations SET location_type = 'livestream' WHERE location_type = 'live';

ALTER TABLE event_locations ADD CONSTRAINT chk_event_locations_type
    CHECK (location_type IN ('main_venue', 'reception', 'livestream', 'videocall'));

-- 3.7 schedule_items
ALTER TABLE schedule_items RENAME COLUMN hora   TO time_label;
ALTER TABLE schedule_items RENAME COLUMN titulo TO title;
ALTER TABLE schedule_items RENAME COLUMN icono  TO icon_name;
ALTER TABLE schedule_items RENAME COLUMN orden  TO sort_order;

-- 3.8 menu_main_courses & menu_sides
ALTER TABLE menu_main_courses RENAME COLUMN nombre TO name;
ALTER TABLE menu_main_courses RENAME COLUMN orden  TO sort_order;

ALTER TABLE menu_sides RENAME COLUMN nombre TO name;
ALTER TABLE menu_sides RENAME COLUMN orden  TO sort_order;

-- 3.9 payment_accounts
ALTER TABLE payment_accounts RENAME COLUMN tipo       TO method_type;
ALTER TABLE payment_accounts RENAME COLUMN banco      TO institution;
ALTER TABLE payment_accounts RENAME COLUMN titular    TO account_holder;
ALTER TABLE payment_accounts RENAME COLUMN telefono   TO phone;
ALTER TABLE payment_accounts RENAME COLUMN cedula     TO document_id;
ALTER TABLE payment_accounts RENAME COLUMN binance_id TO external_account_id;
ALTER TABLE payment_accounts RENAME COLUMN orden      TO sort_order;

-- 3.10 special_mentions
ALTER TABLE special_mentions RENAME COLUMN nombre TO name;
ALTER TABLE special_mentions RENAME COLUMN rol    TO role;
ALTER TABLE special_mentions RENAME COLUMN orden  TO sort_order;

-- ─── 4. Storage bucket `event-gallery` (plus legacy read support) ───
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-gallery', 'event-gallery', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

DROP POLICY IF EXISTS "Upload to event-gallery" ON storage.objects;
CREATE POLICY "Upload to event-gallery"
    ON storage.objects FOR INSERT TO anon, authenticated
    WITH CHECK (bucket_id = 'event-gallery');

DROP POLICY IF EXISTS "Public read event-gallery" ON storage.objects;
CREATE POLICY "Public read event-gallery"
    ON storage.objects FOR SELECT TO anon, authenticated
    USING (bucket_id IN ('event-gallery', 'galeria'));

DROP POLICY IF EXISTS "Admins delete from event-gallery" ON storage.objects;
CREATE POLICY "Admins delete from event-gallery"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id IN ('event-gallery', 'galeria'));

-- ─── 5. Triggers for integrity & visual bounds ──────────────────────

-- 5a. Enforce attendee capacity & build full_name
CREATE OR REPLACE FUNCTION public.trg_rsvp_attendees_before_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_extra INT;
    v_count INT;
BEGIN
    SELECT extra_passes INTO v_extra FROM guests WHERE id = NEW.guest_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'invalid_invitation';
    END IF;

    SELECT count(*) INTO v_count FROM rsvp_attendees WHERE guest_id = NEW.guest_id;
    IF v_count >= 1 + v_extra THEN
        RAISE EXCEPTION 'capacity_exceeded';
    END IF;

    IF NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL THEN
        NEW.full_name := btrim(NEW.first_name) || ' ' || btrim(NEW.last_name);
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER rsvp_attendees_before_insert
    BEFORE INSERT ON rsvp_attendees
    FOR EACH ROW EXECUTE FUNCTION public.trg_rsvp_attendees_before_insert();

-- 5b. Sync confirmed_at on insert/delete
CREATE OR REPLACE FUNCTION public.trg_rsvp_attendees_after_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    UPDATE guests SET confirmed_at = COALESCE(confirmed_at, now()) WHERE id = NEW.guest_id;
    RETURN NULL;
END $$;

CREATE TRIGGER rsvp_attendees_after_insert
    AFTER INSERT ON rsvp_attendees
    FOR EACH ROW EXECUTE FUNCTION public.trg_rsvp_attendees_after_insert();

CREATE OR REPLACE FUNCTION public.trg_rsvp_attendees_after_delete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    UPDATE guests
    SET confirmed_at = NULL
    WHERE id = OLD.guest_id
      AND NOT EXISTS (SELECT 1 FROM rsvp_attendees WHERE guest_id = OLD.guest_id);
    RETURN NULL;
END $$;

CREATE TRIGGER rsvp_attendees_after_delete
    AFTER DELETE ON rsvp_attendees
    FOR EACH ROW EXECUTE FUNCTION public.trg_rsvp_attendees_after_delete();

-- 5c. Prevent reducing extra_passes below already confirmed attendees
CREATE OR REPLACE FUNCTION public.trg_guests_before_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_count INT;
BEGIN
    IF NEW.extra_passes < OLD.extra_passes THEN
        SELECT count(*) INTO v_count FROM rsvp_attendees WHERE guest_id = NEW.id;
        IF v_count > 1 + NEW.extra_passes THEN
            RAISE EXCEPTION 'passes_below_confirmed_count';
        END IF;
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER guests_before_update
    BEFORE UPDATE ON guests
    FOR EACH ROW EXECUTE FUNCTION public.trg_guests_before_update();

-- 5d. Cap total gallery photos per event
CREATE OR REPLACE FUNCTION public.trg_gallery_photos_max_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_total INT;
BEGIN
    SELECT count(*) INTO v_total FROM gallery_photos;
    IF v_total >= 120 THEN
        RAISE EXCEPTION 'gallery_full';
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER gallery_photos_max_limit
    BEFORE INSERT ON gallery_photos
    FOR EACH ROW EXECUTE FUNCTION public.trg_gallery_photos_max_limit();

-- 5e. Generic min/max row bounds trigger for configuration tables
CREATE OR REPLACE FUNCTION public.trg_enforce_row_bounds()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_min   INT  := TG_ARGV[0]::INT;
    v_max   INT  := TG_ARGV[1]::INT;
    v_label TEXT := TG_ARGV[2];
    v_count INT;
BEGIN
    EXECUTE format('SELECT count(*) FROM %I.%I', TG_TABLE_SCHEMA, TG_TABLE_NAME) INTO v_count;

    IF TG_OP = 'INSERT' AND v_count >= v_max THEN
        RAISE EXCEPTION 'max_limit_reached: % cannot exceed % item(s)', v_label, v_max;
    END IF;

    IF TG_OP = 'DELETE' AND v_min > 0 AND v_count <= v_min THEN
        RAISE EXCEPTION 'min_limit_reached: % requires at least % item(s)', v_label, v_min;
    END IF;

    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END $$;

CREATE TRIGGER trg_guest_groups_bounds
    BEFORE INSERT OR DELETE ON guest_groups
    FOR EACH ROW EXECUTE FUNCTION public.trg_enforce_row_bounds('1', '6', 'guest_groups');

CREATE TRIGGER trg_menu_main_courses_bounds
    BEFORE INSERT OR DELETE ON menu_main_courses
    FOR EACH ROW EXECUTE FUNCTION public.trg_enforce_row_bounds('1', '8', 'menu_main_courses');

CREATE TRIGGER trg_menu_sides_bounds
    BEFORE INSERT OR DELETE ON menu_sides
    FOR EACH ROW EXECUTE FUNCTION public.trg_enforce_row_bounds('0', '10', 'menu_sides');

CREATE TRIGGER trg_event_locations_bounds
    BEFORE INSERT OR DELETE ON event_locations
    FOR EACH ROW EXECUTE FUNCTION public.trg_enforce_row_bounds('1', '4', 'event_locations');

CREATE TRIGGER trg_schedule_items_bounds
    BEFORE INSERT OR DELETE ON schedule_items
    FOR EACH ROW EXECUTE FUNCTION public.trg_enforce_row_bounds('0', '8', 'schedule_items');

CREATE TRIGGER trg_payment_accounts_bounds
    BEFORE INSERT OR DELETE ON payment_accounts
    FOR EACH ROW EXECUTE FUNCTION public.trg_enforce_row_bounds('0', '6', 'payment_accounts');

CREATE TRIGGER trg_special_mentions_bounds
    BEFORE INSERT OR DELETE ON special_mentions
    FOR EACH ROW EXECUTE FUNCTION public.trg_enforce_row_bounds('0', '6', 'special_mentions');

-- ─── 6. RPC Functions (English) ─────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_guest_by_token(p_token UUID)
RETURNS SETOF guests LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
    SELECT * FROM guests WHERE access_token = p_token;
$$;

CREATE OR REPLACE FUNCTION public.get_guest_attendees(p_token UUID)
RETURNS TABLE (
    id             UUID,
    first_name     TEXT,
    last_name      TEXT,
    full_name      TEXT,
    is_primary     BOOLEAN,
    main_course_id TEXT,
    side_ids       TEXT[],
    created_at     TIMESTAMPTZ
)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
    SELECT a.id, a.first_name, a.last_name, a.full_name,
           a.is_primary, a.main_course_id, a.side_ids, a.created_at
    FROM rsvp_attendees a
    JOIN guests g ON g.id = a.guest_id
    WHERE g.access_token = p_token
    ORDER BY a.is_primary DESC, a.created_at ASC;
$$;

CREATE OR REPLACE FUNCTION public.submit_rsvp(p_token UUID, p_attendees JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_guest       guests;
    v_max_sides   INT;
    v_existing    INT;
    v_has_primary BOOLEAN;
    v_n           INT;
    v_i           INT := 0;
    a             JSONB;
    v_is_primary  BOOLEAN;
    v_first       TEXT;
    v_last        TEXT;
    v_sides       JSONB;
BEGIN
    SELECT * INTO v_guest FROM guests WHERE access_token = p_token FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'invalid_invitation';
    END IF;

    SELECT count(*), COALESCE(bool_or(is_primary), FALSE)
    INTO v_existing, v_has_primary
    FROM rsvp_attendees
    WHERE guest_id = v_guest.id;

    IF v_existing >= 1 + v_guest.extra_passes THEN
        RAISE EXCEPTION 'passes_exhausted';
    END IF;

    IF p_attendees IS NULL OR jsonb_typeof(p_attendees) <> 'array' THEN
        RAISE EXCEPTION 'no_attendees';
    END IF;
    v_n := jsonb_array_length(p_attendees);
    IF v_n < 1 THEN
        RAISE EXCEPTION 'no_attendees';
    END IF;
    IF v_existing + v_n > 1 + v_guest.extra_passes THEN
        RAISE EXCEPTION 'capacity_exceeded';
    END IF;

    SELECT COALESCE(max_sides, 2) INTO v_max_sides FROM event_settings WHERE id = 'default';

    FOR a IN SELECT * FROM jsonb_array_elements(p_attendees) LOOP
        v_is_primary := (NOT v_has_primary AND v_i = 0);

        IF v_is_primary THEN
            v_first := v_guest.first_name;
            v_last  := v_guest.last_name;
        ELSE
            v_first := btrim(COALESCE(a->>'first_name', ''));
            v_last  := btrim(COALESCE(a->>'last_name', ''));
        END IF;

        IF v_first = '' OR v_last = '' THEN
            RAISE EXCEPTION 'incomplete_attendee_name';
        END IF;
        IF COALESCE(a->>'main_course_id', '') = '' THEN
            RAISE EXCEPTION 'incomplete_menu';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM menu_main_courses WHERE id = a->>'main_course_id') THEN
            RAISE EXCEPTION 'invalid_main_course';
        END IF;

        v_sides := COALESCE(a->'side_ids', '[]'::jsonb);
        IF jsonb_array_length(v_sides) > v_max_sides THEN
            RAISE EXCEPTION 'too_many_sides';
        END IF;
        IF EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(v_sides) s
            WHERE NOT EXISTS (SELECT 1 FROM menu_sides ms WHERE ms.id = s)
        ) THEN
            RAISE EXCEPTION 'invalid_side';
        END IF;

        INSERT INTO rsvp_attendees
            (guest_id, first_name, last_name, full_name, is_primary, main_course_id, side_ids, gift_option_id)
        VALUES
            (v_guest.id, v_first, v_last, v_first || ' ' || v_last, v_is_primary,
             a->>'main_course_id',
             ARRAY(SELECT jsonb_array_elements_text(v_sides)),
             NULLIF(a->>'gift_option_id', ''));

        v_i := v_i + 1;
    END LOOP;

    UPDATE guests SET confirmed_at = COALESCE(confirmed_at, now())
    WHERE id = v_guest.id RETURNING * INTO v_guest;

    RETURN to_jsonb(v_guest);
END $$;

CREATE OR REPLACE FUNCTION public.reset_guest_rsvp(p_guest_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF auth.role() <> 'authenticated' THEN
        RAISE EXCEPTION 'unauthorized';
    END IF;
    DELETE FROM rsvp_attendees WHERE guest_id = p_guest_id;
    UPDATE guests SET confirmed_at = NULL WHERE id = p_guest_id;
END $$;

CREATE OR REPLACE FUNCTION public.get_approved_photos()
RETURNS TABLE (id UUID, storage_path TEXT, created_at TIMESTAMPTZ, author_name TEXT)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
    SELECT p.id, p.storage_path, p.created_at, btrim(g.first_name || ' ' || g.last_name)
    FROM gallery_photos p
    JOIN guests g ON g.id = p.guest_id
    WHERE p.status = 'approved'
    ORDER BY p.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.can_guest_upload_photos(p_guest_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
    SELECT COALESCE((SELECT can_upload_photos FROM guests WHERE id = p_guest_id), FALSE);
$$;

REVOKE EXECUTE ON FUNCTION public.reset_guest_rsvp(UUID) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.reset_guest_rsvp(UUID)        TO authenticated;
GRANT  EXECUTE ON FUNCTION public.get_guest_by_token(UUID)      TO anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_guest_attendees(UUID)     TO anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.submit_rsvp(UUID, JSONB)      TO anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_approved_photos()         TO anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.can_guest_upload_photos(UUID) TO anon, authenticated;

-- ─── 7. Clean English RLS Policies across all tables ────────────────
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

REVOKE ALL ON TABLE
    guests, rsvp_attendees, gallery_photos, event_settings,
    guest_groups, menu_main_courses, menu_sides, event_locations,
    schedule_items, payment_accounts, special_mentions
FROM anon;

GRANT ALL ON TABLE
    guests, rsvp_attendees, gallery_photos, event_settings,
    guest_groups, menu_main_courses, menu_sides, event_locations,
    schedule_items, payment_accounts, special_mentions
TO authenticated, service_role;

GRANT SELECT ON TABLE
    event_settings, guest_groups, menu_main_courses, menu_sides,
    event_locations, schedule_items, payment_accounts, special_mentions
TO anon;

GRANT SELECT, INSERT ON TABLE gallery_photos TO anon;

-- Private tables: admins only (guests interact via SECURITY DEFINER RPCs)
CREATE POLICY "Admins manage guests"
    ON guests FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Admins manage rsvp_attendees"
    ON rsvp_attendees FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- Public-read configuration tables
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'event_settings','guest_groups','menu_main_courses','menu_sides',
        'event_locations','schedule_items','payment_accounts','special_mentions'
    ] LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('CREATE POLICY "Public read %s" ON %I FOR SELECT TO anon, authenticated USING (TRUE)', t, t);
        EXECUTE format('CREATE POLICY "Admins manage %s" ON %I FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE)', t, t);
    END LOOP;
END $$;

-- Gallery photos policies
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read approved photos"
    ON gallery_photos FOR SELECT TO anon
    USING (status = 'approved');

CREATE POLICY "Permitted guests upload pending photos"
    ON gallery_photos FOR INSERT TO anon
    WITH CHECK (status = 'pending' AND public.can_guest_upload_photos(guest_id));

CREATE POLICY "Admins manage gallery_photos"
    ON gallery_photos FOR ALL TO authenticated
    USING (TRUE) WITH CHECK (TRUE);

-- ─── 8. Schema documentation comments ───────────────────────────────
COMMENT ON TABLE event_settings    IS 'Global event configuration (single row id = ''default'')';
COMMENT ON TABLE guest_groups      IS 'Guest groups / categories (min 1, max 6; referenced by guests.group_id)';
COMMENT ON TABLE guests            IS 'Master guest list with unique access_token and extra_passes (0..15)';
COMMENT ON TABLE rsvp_attendees    IS 'Confirmed attendees linked to a primary guest with menu selections';
COMMENT ON TABLE gallery_photos    IS 'Shared event photos moderated by organizers (max 120 per event)';
COMMENT ON TABLE event_locations   IS 'Physical venues or virtual access links (min 1, max 4)';
COMMENT ON TABLE schedule_items    IS 'Event timeline / agenda items (min 0, max 8)';
COMMENT ON TABLE menu_main_courses IS 'Main course options (min 1, max 8)';
COMMENT ON TABLE menu_sides        IS 'Side dish options (min 0, max 10)';
COMMENT ON TABLE payment_accounts  IS 'Contribution / gift / payment accounts (min 0, max 6)';
COMMENT ON TABLE special_mentions  IS 'Honorees, sponsors, committee or special mentions (min 0, max 6)';
