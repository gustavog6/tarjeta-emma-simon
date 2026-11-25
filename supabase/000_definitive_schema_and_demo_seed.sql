-- ============================================================================
-- Master Migration 000 — Definitive Schema & Commercial Demo Seed (100% Clean)
-- Execute in: Supabase Dashboard → SQL Editor
--
-- Purpose:
--   Single-file, production-ready installation for NEW deployments / sales demos.
--   Replaces running historical migrations 001..009 sequentially.
--
-- Architecture:
--   • 100% normalized relational schema in English (ZERO JSONB columns in tables)
--   • Strict mobile-first character & row-count bounds enforced in PostgreSQL
--   • Atomic SECURITY DEFINER RPCs for token-gated guest access & RSVP
--   • Row Level Security (RLS) enabled explicitly on all 11 tables
--   • Public `event-gallery` Storage bucket & policies
--   • Neutral role-based demo data (zero real personal names), 7 curated event
--     stock photos, and 3 showcase guest cases ready for live client demos.
--
-- Note: Does NOT touch `event_backup` schema if one exists in the database.
-- ============================================================================

BEGIN;

-- ─── 1. Schema Usage & Clean Reset of Public Event Objects ──────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

DROP FUNCTION IF EXISTS public.get_guest_by_token(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_guest_attendees(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.submit_rsvp(UUID, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.reset_guest_rsvp(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_approved_photos() CASCADE;
DROP FUNCTION IF EXISTS public.can_guest_upload_photos(UUID) CASCADE;

DROP FUNCTION IF EXISTS public.trg_rsvp_attendees_before_insert() CASCADE;
DROP FUNCTION IF EXISTS public.trg_rsvp_attendees_after_insert() CASCADE;
DROP FUNCTION IF EXISTS public.trg_rsvp_attendees_after_delete() CASCADE;
DROP FUNCTION IF EXISTS public.trg_guests_before_update() CASCADE;
DROP FUNCTION IF EXISTS public.trg_gallery_photos_max_limit() CASCADE;
DROP FUNCTION IF EXISTS public.trg_enforce_row_bounds() CASCADE;

DROP TABLE IF EXISTS public.gallery_photos    CASCADE;
DROP TABLE IF EXISTS public.rsvp_attendees    CASCADE;
DROP TABLE IF EXISTS public.guests            CASCADE;
DROP TABLE IF EXISTS public.special_mentions  CASCADE;
DROP TABLE IF EXISTS public.payment_accounts  CASCADE;
DROP TABLE IF EXISTS public.schedule_items    CASCADE;
DROP TABLE IF EXISTS public.event_locations   CASCADE;
DROP TABLE IF EXISTS public.menu_sides        CASCADE;
DROP TABLE IF EXISTS public.menu_main_courses CASCADE;
DROP TABLE IF EXISTS public.guest_groups      CASCADE;
DROP TABLE IF EXISTS public.event_settings    CASCADE;

-- ─── 2. Core Relational Tables (100% Normalized, Zero JSONB) ────────────────

-- 2.1 Global Event Settings (single row `id = 'default'`)
CREATE TABLE public.event_settings (
    id                            TEXT PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
    event_type                    TEXT NOT NULL DEFAULT 'wedding'
                                  CHECK (event_type IN ('wedding', 'birthday', 'gala', 'corporate', 'anniversary', 'graduation', 'casual', 'custom')),
    primary_host_first_name       TEXT NOT NULL DEFAULT 'Nombre Novio',
    primary_host_last_name        TEXT DEFAULT 'Apellido Novio',
    primary_host_phone            TEXT DEFAULT '+584140000001',
    secondary_host_first_name     TEXT DEFAULT 'Nombre Novia',
    secondary_host_last_name      TEXT DEFAULT 'Apellido Novia',
    secondary_host_phone          TEXT DEFAULT '+584240000002',
    event_date                    TIMESTAMPTZ NOT NULL,
    rsvp_deadline                 TIMESTAMPTZ NOT NULL,
    dress_code                    TEXT DEFAULT 'Formal / Elegante',
    max_sides                     INT  NOT NULL DEFAULT 2,
    public_url                    TEXT,
    whatsapp_template             TEXT,
    rsvp_group_prompt             TEXT DEFAULT '¿De parte de quién nos acompañas?',
    rsvp_whatsapp_intro           TEXT DEFAULT '¡Hola! Confirmo asistencia a la boda de {hosts} 💍',
    calendar_title_template       TEXT DEFAULT 'Boda {hosts}',
    calendar_description_template TEXT DEFAULT 'Acompáñanos a celebrar nuestra boda en {venue}.',
    story_badge                   TEXT DEFAULT '¡NOS CASAMOS!',
    story_footer                  TEXT DEFAULT '"Acompáñanos a celebrar nuestro gran día"',
    mentions_section_title        TEXT DEFAULT 'Con la bendición de',
    special_mentions_title        TEXT DEFAULT 'Nuestros Padrinos',
    group_a_label                 TEXT DEFAULT 'Familia de la Novia',
    group_a_member_1              TEXT,
    group_a_member_2              TEXT,
    group_b_label                 TEXT DEFAULT 'Familia del Novio',
    group_b_member_1              TEXT,
    group_b_member_2              TEXT,
    hero_badge                    TEXT DEFAULT 'Nos casamos',
    date_section_title            TEXT DEFAULT 'Save the Date',
    date_weekday_label            TEXT DEFAULT 'Sábado',
    locations_title               TEXT DEFAULT 'Acompáñanos',
    locations_subtitle            TEXT DEFAULT 'Será un honor para nosotros contar con tu presencia en este día tan especial.',
    schedule_title                TEXT DEFAULT 'Itinerario',
    rsvp_title                    TEXT DEFAULT 'Confirmar Asistencia',
    rsvp_subtitle                 TEXT DEFAULT 'Esperamos contar contigo. Por favor confirma tu asistencia antes de la fecha indicada.',
    contributions_title           TEXT DEFAULT 'Mesa de Regalos',
    contributions_subtitle        TEXT DEFAULT 'Su presencia es nuestro mejor regalo, pero si desean tener un detalle con nosotros:',
    closing_quote                 TEXT DEFAULT '"Estamos muy emocionados de compartir este día tan especial junto a ti."',
    closing_signature             TEXT DEFAULT 'Con cariño, Nombre Novio & Nombre Novia',
    footer_note                   TEXT,
    footer_reference              TEXT,
    welcome_button_label          TEXT DEFAULT 'Abrir invitación',
    updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_event_settings_lengths CHECK (
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
    )
);

-- 2.2 Guest Groups / Categories (min 1, max 6)
CREATE TABLE public.guest_groups (
    id            TEXT PRIMARY KEY CHECK (char_length(btrim(id)) BETWEEN 1 AND 40),
    name          TEXT NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 30),
    color         TEXT NOT NULL DEFAULT 'gray'
                  CHECK (color IN ('pink', 'blue', 'green', 'purple', 'amber', 'gray')),
    icon_key      TEXT NOT NULL DEFAULT 'Users'
                  CHECK (char_length(btrim(icon_key)) BETWEEN 1 AND 30),
    contact_phone TEXT CHECK (contact_phone IS NULL OR char_length(contact_phone) <= 25),
    sort_order    INT  NOT NULL DEFAULT 0
);

-- 2.3 Menu Main Courses (min 1, max 8)
CREATE TABLE public.menu_main_courses (
    id         TEXT PRIMARY KEY CHECK (char_length(btrim(id)) BETWEEN 1 AND 60),
    name       TEXT NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 55),
    sort_order INT  NOT NULL DEFAULT 0
);

-- 2.4 Menu Side Dishes (min 0, max 10)
CREATE TABLE public.menu_sides (
    id         TEXT PRIMARY KEY CHECK (char_length(btrim(id)) BETWEEN 1 AND 60),
    name       TEXT NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 40),
    sort_order INT  NOT NULL DEFAULT 0
);

-- 2.5 Event Locations — Physical Venues & Virtual Links (min 1, max 4)
CREATE TABLE public.event_locations (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    location_type TEXT NOT NULL DEFAULT 'main_venue'
                  CHECK (location_type IN ('main_venue', 'reception', 'livestream', 'videocall')),
    title         TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 40),
    venue_name    TEXT CHECK (venue_name    IS NULL OR char_length(venue_name)    <= 60),
    address       TEXT CHECK (address       IS NULL OR char_length(address)       <= 120),
    time_label    TEXT CHECK (time_label    IS NULL OR char_length(time_label)    <= 25),
    map_url       TEXT CHECK (map_url       IS NULL OR char_length(map_url)       <= 500),
    external_link TEXT CHECK (external_link IS NULL OR char_length(external_link) <= 500),
    platform      TEXT CHECK (platform      IS NULL OR char_length(platform)      <= 60),
    stream_url    TEXT CHECK (stream_url    IS NULL OR char_length(stream_url)    <= 500),
    access_code   TEXT CHECK (access_code   IS NULL OR char_length(access_code)   <= 120),
    sort_order    INT  NOT NULL DEFAULT 0
);

-- 2.6 Schedule / Timeline Items (min 0, max 8)
CREATE TABLE public.schedule_items (
    id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    time_label TEXT NOT NULL CHECK (char_length(btrim(time_label)) BETWEEN 1 AND 15),
    title      TEXT NOT NULL CHECK (char_length(btrim(title))      BETWEEN 1 AND 55),
    icon_name  TEXT NOT NULL DEFAULT 'MapPin' CHECK (char_length(btrim(icon_name)) BETWEEN 1 AND 30),
    sort_order INT  NOT NULL DEFAULT 0
);

-- 2.7 Payment / Gift / Contribution Accounts (min 0, max 6)
CREATE TABLE public.payment_accounts (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    method_type         TEXT NOT NULL DEFAULT 'Pago Móvil'
                        CHECK (method_type IN ('Pago Móvil', 'Binance Pay')),
    institution         TEXT NOT NULL CHECK (char_length(btrim(institution))    BETWEEN 1 AND 35),
    account_holder      TEXT NOT NULL CHECK (char_length(btrim(account_holder)) BETWEEN 1 AND 50),
    phone               TEXT CHECK (phone               IS NULL OR char_length(phone)               <= 35),
    document_id         TEXT CHECK (document_id         IS NULL OR char_length(document_id)         <= 35),
    external_account_id TEXT CHECK (external_account_id IS NULL OR char_length(external_account_id) <= 35),
    sort_order          INT  NOT NULL DEFAULT 0
);

-- 2.8 Special Mentions — Sponsors, Padrinos, Honorees (min 0, max 6)
CREATE TABLE public.special_mentions (
    id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name       TEXT NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 50),
    role       TEXT NOT NULL CHECK (char_length(btrim(role)) BETWEEN 1 AND 30),
    sort_order INT  NOT NULL DEFAULT 0
);

-- 2.9 Master Guests List (1 primary guest + `extra_passes` companions)
CREATE TABLE public.guests (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    access_token      UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    first_name        TEXT NOT NULL,
    last_name         TEXT NOT NULL,
    email             TEXT,
    phone             TEXT NOT NULL,
    group_id          TEXT NOT NULL
                      CONSTRAINT fk_guests_group REFERENCES public.guest_groups(id)
                      ON UPDATE CASCADE ON DELETE RESTRICT,
    extra_passes      INT  NOT NULL DEFAULT 0,
    can_upload_photos BOOLEAN NOT NULL DEFAULT TRUE,
    confirmed_at      TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_guests_bounds CHECK (
        char_length(btrim(first_name))          BETWEEN 1 AND 40 AND
        char_length(btrim(last_name))           BETWEEN 1 AND 40 AND
        char_length(btrim(COALESCE(phone, ''))) BETWEEN 1 AND 25 AND
        char_length(btrim(COALESCE(email, ''))) <= 100 AND
        char_length(btrim(group_id))            BETWEEN 1 AND 40 AND
        extra_passes                            BETWEEN 0 AND 15
    )
);

-- 2.10 Confirmed RSVP Attendees & Menu Selections
CREATE TABLE public.rsvp_attendees (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id       UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
    first_name     TEXT,
    last_name      TEXT,
    full_name      TEXT NOT NULL,
    is_primary     BOOLEAN NOT NULL DEFAULT FALSE,
    main_course_id TEXT,
    side_ids       TEXT[] NOT NULL DEFAULT '{}',
    gift_option_id TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_rsvp_attendees_lengths CHECK (
        char_length(btrim(full_name)) BETWEEN 1 AND 85 AND
        (first_name IS NULL OR char_length(btrim(first_name)) BETWEEN 1 AND 40) AND
        (last_name  IS NULL OR char_length(btrim(last_name))  BETWEEN 1 AND 40)
    )
);

-- 2.11 Shared Event Photo Gallery (max 120 photos per event)
CREATE TABLE public.gallery_photos (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id     UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 3. Indexes ─────────────────────────────────────────────────────────────
CREATE INDEX idx_guests_access_token       ON public.guests(access_token);
CREATE INDEX idx_rsvp_attendees_guest      ON public.rsvp_attendees(guest_id);
CREATE UNIQUE INDEX uq_rsvp_attendees_primary ON public.rsvp_attendees(guest_id) WHERE is_primary;
CREATE INDEX idx_gallery_photos_status     ON public.gallery_photos(status);
CREATE INDEX idx_gallery_photos_guest      ON public.gallery_photos(guest_id);

-- ─── 4. Storage Bucket `event-gallery` & Object Policies ────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-gallery', 'event-gallery', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

DROP POLICY IF EXISTS "Upload to event-gallery"        ON storage.objects;
DROP POLICY IF EXISTS "Public read event-gallery"      ON storage.objects;
DROP POLICY IF EXISTS "Admins delete from event-gallery" ON storage.objects;

CREATE POLICY "Upload to event-gallery"
    ON storage.objects FOR INSERT TO anon, authenticated
    WITH CHECK (bucket_id = 'event-gallery');

CREATE POLICY "Public read event-gallery"
    ON storage.objects FOR SELECT TO anon, authenticated
    USING (bucket_id = 'event-gallery');

CREATE POLICY "Admins delete from event-gallery"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'event-gallery');

-- ─── 5. Integrity & Visual-Bounds Triggers ──────────────────────────────────

-- 5.1 Enforce pass limit (`1 + extra_passes`) and keep `full_name` normalized
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
    BEFORE INSERT ON public.rsvp_attendees
    FOR EACH ROW EXECUTE FUNCTION public.trg_rsvp_attendees_before_insert();

-- 5.2 Automatically maintain `guests.confirmed_at` on attendee insert/delete
CREATE OR REPLACE FUNCTION public.trg_rsvp_attendees_after_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    UPDATE guests SET confirmed_at = COALESCE(confirmed_at, now()) WHERE id = NEW.guest_id;
    RETURN NULL;
END $$;

CREATE TRIGGER rsvp_attendees_after_insert
    AFTER INSERT ON public.rsvp_attendees
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
    AFTER DELETE ON public.rsvp_attendees
    FOR EACH ROW EXECUTE FUNCTION public.trg_rsvp_attendees_after_delete();

-- 5.3 Prevent lowering `extra_passes` below already confirmed attendee count
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
    BEFORE UPDATE ON public.guests
    FOR EACH ROW EXECUTE FUNCTION public.trg_guests_before_update();

-- 5.4 Cap total gallery photos per event at 120
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
    BEFORE INSERT ON public.gallery_photos
    FOR EACH ROW EXECUTE FUNCTION public.trg_gallery_photos_max_limit();

-- 5.5 Enforce min/max row bounds on relational configuration tables
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
    BEFORE INSERT OR DELETE ON public.guest_groups
    FOR EACH ROW EXECUTE FUNCTION public.trg_enforce_row_bounds('1', '6', 'guest_groups');

CREATE TRIGGER trg_menu_main_courses_bounds
    BEFORE INSERT OR DELETE ON public.menu_main_courses
    FOR EACH ROW EXECUTE FUNCTION public.trg_enforce_row_bounds('1', '8', 'menu_main_courses');

CREATE TRIGGER trg_menu_sides_bounds
    BEFORE INSERT OR DELETE ON public.menu_sides
    FOR EACH ROW EXECUTE FUNCTION public.trg_enforce_row_bounds('0', '10', 'menu_sides');

CREATE TRIGGER trg_event_locations_bounds
    BEFORE INSERT OR DELETE ON public.event_locations
    FOR EACH ROW EXECUTE FUNCTION public.trg_enforce_row_bounds('1', '4', 'event_locations');

CREATE TRIGGER trg_schedule_items_bounds
    BEFORE INSERT OR DELETE ON public.schedule_items
    FOR EACH ROW EXECUTE FUNCTION public.trg_enforce_row_bounds('0', '8', 'schedule_items');

CREATE TRIGGER trg_payment_accounts_bounds
    BEFORE INSERT OR DELETE ON public.payment_accounts
    FOR EACH ROW EXECUTE FUNCTION public.trg_enforce_row_bounds('0', '6', 'payment_accounts');

CREATE TRIGGER trg_special_mentions_bounds
    BEFORE INSERT OR DELETE ON public.special_mentions
    FOR EACH ROW EXECUTE FUNCTION public.trg_enforce_row_bounds('0', '6', 'special_mentions');

-- ─── 6. Secure RPC Functions ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_guest_by_token(p_token UUID)
RETURNS SETOF public.guests LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
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

-- ─── 7. Explicit Row Level Security (RLS) & Privileges ──────────────────────

ALTER TABLE public.event_settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_groups      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_main_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_sides        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_locations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_accounts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_mentions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvp_attendees    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_photos    ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
    public.guests, public.rsvp_attendees, public.gallery_photos, public.event_settings,
    public.guest_groups, public.menu_main_courses, public.menu_sides, public.event_locations,
    public.schedule_items, public.payment_accounts, public.special_mentions
FROM anon;

GRANT ALL ON TABLE
    public.guests, public.rsvp_attendees, public.gallery_photos, public.event_settings,
    public.guest_groups, public.menu_main_courses, public.menu_sides, public.event_locations,
    public.schedule_items, public.payment_accounts, public.special_mentions
TO authenticated, service_role;

GRANT SELECT ON TABLE
    public.event_settings, public.guest_groups, public.menu_main_courses, public.menu_sides,
    public.event_locations, public.schedule_items, public.payment_accounts, public.special_mentions
TO anon;

GRANT SELECT, INSERT ON TABLE public.gallery_photos TO anon;

-- Private guest/RSVP tables: authenticated admins only (guests use RPCs)
CREATE POLICY "Admins manage guests"
    ON public.guests FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Admins manage rsvp_attendees"
    ON public.rsvp_attendees FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- Public-read configuration tables + full authenticated admin management
CREATE POLICY "Public read event_settings"    ON public.event_settings    FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "Admins manage event_settings"  ON public.event_settings    FOR ALL    TO authenticated       USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Public read guest_groups"      ON public.guest_groups      FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "Admins manage guest_groups"    ON public.guest_groups      FOR ALL    TO authenticated       USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Public read menu_main_courses"   ON public.menu_main_courses FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "Admins manage menu_main_courses" ON public.menu_main_courses FOR ALL    TO authenticated       USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Public read menu_sides"        ON public.menu_sides        FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "Admins manage menu_sides"      ON public.menu_sides        FOR ALL    TO authenticated       USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Public read event_locations"   ON public.event_locations   FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "Admins manage event_locations" ON public.event_locations   FOR ALL    TO authenticated       USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Public read schedule_items"    ON public.schedule_items    FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "Admins manage schedule_items"  ON public.schedule_items    FOR ALL    TO authenticated       USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Public read payment_accounts"   ON public.payment_accounts FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "Admins manage payment_accounts" ON public.payment_accounts FOR ALL    TO authenticated       USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Public read special_mentions"   ON public.special_mentions FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "Admins manage special_mentions" ON public.special_mentions FOR ALL    TO authenticated       USING (TRUE) WITH CHECK (TRUE);

-- Gallery photo policies
CREATE POLICY "Public read approved photos"
    ON public.gallery_photos FOR SELECT TO anon
    USING (status = 'approved');

CREATE POLICY "Permitted guests upload pending photos"
    ON public.gallery_photos FOR INSERT TO anon
    WITH CHECK (status = 'pending' AND public.can_guest_upload_photos(guest_id));

CREATE POLICY "Admins manage gallery_photos"
    ON public.gallery_photos FOR ALL TO authenticated
    USING (TRUE) WITH CHECK (TRUE);

-- Table comments
COMMENT ON TABLE public.event_settings    IS 'Global event configuration (single row id = ''default'')';
COMMENT ON TABLE public.guest_groups      IS 'Guest groups / categories (min 1, max 6; referenced by guests.group_id)';
COMMENT ON TABLE public.guests            IS 'Master guest list with unique access_token and extra_passes (0..15)';
COMMENT ON TABLE public.rsvp_attendees    IS 'Confirmed attendees linked to a primary guest with menu selections';
COMMENT ON TABLE public.gallery_photos    IS 'Shared event photos moderated by organizers (max 120 per event)';
COMMENT ON TABLE public.event_locations   IS 'Physical venues or virtual access links (min 1, max 4)';
COMMENT ON TABLE public.schedule_items    IS 'Event timeline / agenda items (min 0, max 8)';
COMMENT ON TABLE public.menu_main_courses IS 'Main course options (min 1, max 8)';
COMMENT ON TABLE public.menu_sides        IS 'Side dish options (min 0, max 10)';
COMMENT ON TABLE public.payment_accounts  IS 'Contribution / gift / payment accounts (min 0, max 6)';
COMMENT ON TABLE public.special_mentions  IS 'Honorees, sponsors, committee or special mentions (min 0, max 6)';

-- ============================================================================
-- 8. COMMERCIAL DEMO SEED DATA (Zero Real Personal Names)
-- ============================================================================

-- 8.1 Event Settings (Neutral role placeholders for people; polished event copy)
INSERT INTO public.event_settings (
    id,
    event_type,
    primary_host_first_name,
    primary_host_last_name,
    primary_host_phone,
    secondary_host_first_name,
    secondary_host_last_name,
    secondary_host_phone,
    event_date,
    rsvp_deadline,
    dress_code,
    max_sides,
    public_url,
    whatsapp_template,
    rsvp_group_prompt,
    rsvp_whatsapp_intro,
    calendar_title_template,
    calendar_description_template,
    story_badge,
    story_footer,
    mentions_section_title,
    special_mentions_title,
    group_a_label,
    group_a_member_1,
    group_a_member_2,
    group_b_label,
    group_b_member_1,
    group_b_member_2,
    hero_badge,
    date_section_title,
    date_weekday_label,
    locations_title,
    locations_subtitle,
    schedule_title,
    rsvp_title,
    rsvp_subtitle,
    contributions_title,
    contributions_subtitle,
    closing_quote,
    closing_signature,
    footer_note,
    footer_reference,
    welcome_button_label
) VALUES (
    'default',
    'wedding',
    'Nombre Novio',
    'Apellido Novio',
    '+584140000001',
    'Nombre Novia',
    'Apellido Novia',
    '+584240000002',
    '2027-08-21T17:00:00-04:00',
    '2027-08-05T23:59:59-04:00',
    'Formal / Elegante',
    2,
    NULL,
    '¡Hola {guest_name}! Estamos muy felices de compartir nuestro día contigo. Esta invitación es válida para {passes}. Confírmanos tu asistencia y menú antes del {rsvp_deadline}. Nos vemos pronto. Con cariño, {hosts} ✨' || E'\n\n' || '{link}',
    '¿De parte de quién nos acompañas?',
    '¡Hola! Confirmo asistencia a la boda de {hosts} 💍',
    'Boda {hosts}',
    'Acompáñanos a celebrar nuestra boda en {venue}.',
    '¡NOS CASAMOS!',
    '"Acompáñanos a celebrar nuestro gran día"',
    'Con la bendición de',
    'Nuestros Padrinos',
    'Familia de la Novia',
    'Padre Novia',
    'Madre Novia',
    'Familia del Novio',
    'Padre Novio',
    'Madre Novio',
    'Nos casamos',
    'Save the Date',
    'Sábado',
    'Acompáñanos',
    'Será un honor para nosotros contar con tu presencia en este día tan especial.',
    'Itinerario',
    'Confirmar Asistencia',
    'Esperamos contar contigo. Por favor confirma tu asistencia y selección de menú antes de la fecha indicada.',
    'Mesa de Regalos',
    'Su presencia es nuestro mejor regalo, pero si desean tener un detalle con nosotros:',
    '"Estamos muy emocionados de compartir el inicio de esta nueva etapa junto a las personas que más queremos."',
    'Con cariño, Nombre Novio & Nombre Novia',
    '"El amor es paciente, es bondadoso; todo lo disculpa, todo lo cree, todo lo espera, todo lo soporta."',
    '1 Corintios 13:4-7',
    'Abrir invitación'
);

-- 8.2 Guest Groups
INSERT INTO public.guest_groups (id, name, color, icon_key, contact_phone, sort_order) VALUES
    ('grupo-novia', 'Familia de la Novia', 'pink', 'dress', '+584240000002', 0),
    ('grupo-novio', 'Familia del Novio',   'blue', 'shirt', '+584140000001', 1);

-- 8.3 Menu Main Courses & Sides
INSERT INTO public.menu_main_courses (id, name, sort_order) VALUES
    ('lomito-vino',     'Medallón de Lomito en Salsa de Vino',   0),
    ('pollo-parmesana', 'Suprema de Pollo a la Parmesana',       1),
    ('salmon-hierbas',  'Filete de Salmón a las Finas Hierbas',  2),
    ('risotto-hongos',  'Risotto Cremoso de Champiñones',        3);

INSERT INTO public.menu_sides (id, name, sort_order) VALUES
    ('pure-papas',      'Puré de Papas Rústico',   0),
    ('vegetales-salte', 'Vegetales Salteados',     1),
    ('ensalada-cesar',  'Ensalada César Fresca',   2),
    ('arroz-almendras', 'Arroz con Almendras',     3),
    ('papas-gratin',    'Papas Gratinadas',        4);

-- 8.4 Event Locations (Ceremony + Reception)
INSERT INTO public.event_locations (
    id, location_type, title, venue_name, address, time_label,
    map_url, external_link, sort_order
) VALUES
    (
        'ceremonia-demo',
        'main_venue',
        'Ceremonia Principal',
        'Capilla & Jardín Central Mirador',
        'Av. Principal del Parque Central, Sector Jardines del Este',
        '05:00 PM',
        'https://www.google.com/maps?q=10.4960,-66.8530&z=15&output=embed',
        'https://maps.google.com/?q=10.4960,-66.8530',
        0
    ),
    (
        'recepcion-demo',
        'reception',
        'Recepción y Celebración',
        'Salón Gran Cristal & Terraza',
        'Av. Principal del Parque Central, Nivel Terraza Panorámica',
        '07:00 PM',
        'https://www.google.com/maps?q=10.5010,-66.8560&z=15&output=embed',
        'https://maps.google.com/?q=10.5010,-66.8560',
        1
    );

-- 8.5 Schedule / Timeline
INSERT INTO public.schedule_items (id, time_label, title, icon_name, sort_order) VALUES
    ('it-1', '04:30 PM', 'Llegada y Bienvenida',         'MapPin',   0),
    ('it-2', '05:00 PM', 'Ceremonia Central',            'Church',   1),
    ('it-3', '06:00 PM', 'Brindis y Sesión Fotográfica', 'Camera',   2),
    ('it-4', '07:30 PM', 'Cena de Celebración',          'Utensils', 3),
    ('it-5', '09:00 PM', 'Apertura de Pista y Fiesta',   'Music',    4);

-- 8.6 Payment / Gift Accounts (Role-based account holders)
INSERT INTO public.payment_accounts (
    id, method_type, institution, account_holder, phone, document_id, external_account_id, sort_order
) VALUES
    ('cta-1', 'Pago Móvil',  'Banco Principal (0102)', 'Nombre Novia Apellido Novia', '0424-0000002', 'V-00.000.002', NULL,        0),
    ('cta-2', 'Pago Móvil',  'Banco Principal (0102)', 'Nombre Novio Apellido Novio', '0414-0000001', 'V-00.000.001', NULL,        1),
    ('cta-3', 'Binance Pay', 'Binance Pay',            'Nombre Novio Apellido Novio', NULL,           NULL,           '100000001', 2);

-- 8.7 Special Mentions / Padrinos (Role-based names)
INSERT INTO public.special_mentions (id, name, role, sort_order) VALUES
    ('pad-1', 'Padrino Uno', 'Padrino de Honor',     0),
    ('pad-2', 'Madrina Uno', 'Madrina de Honor',     1),
    ('pad-3', 'Padrino Dos', 'Testigo de Ceremonia', 2),
    ('pad-4', 'Madrina Dos', 'Testigo de Ceremonia', 3);

-- 8.8 Showcase Guests — 3 Exact Demo Cases
INSERT INTO public.guests (
    id, access_token, first_name, last_name, email, phone,
    group_id, extra_passes, can_upload_photos, confirmed_at
) VALUES
    -- Caso 1: Invitado solo (1 pase total, pendiente por confirmar para probar el formulario en vivo)
    (
        '33333333-3333-4333-8333-333333333301',
        '00000000-0000-4000-8000-000000000001',
        'Nombre',
        'Invitado Uno',
        'invitado.uno@ejemplo.com',
        '+584140000101',
        'grupo-novia',
        0,
        TRUE,
        NULL
    ),
    -- Caso 2: Invitado con 1 acompañante confirmado (2 / 2 pases confirmados)
    (
        '33333333-3333-4333-8333-333333333302',
        '00000000-0000-4000-8000-000000000002',
        'Nombre',
        'Invitado Dos',
        'invitado.dos@ejemplo.com',
        '+584240000102',
        'grupo-novio',
        1,
        TRUE,
        now() - interval '2 days'
    ),
    -- Caso 3: Invitado con 2 acompañantes permitidos y 1 falto por confirmar (2 / 3 confirmados)
    (
        '33333333-3333-4333-8333-333333333303',
        '00000000-0000-4000-8000-000000000003',
        'Nombre',
        'Invitado Tres',
        'invitado.tres@ejemplo.com',
        '+584120000103',
        'grupo-novia',
        2,
        TRUE,
        now() - interval '1 day'
    );

-- 8.9 RSVP Confirmations for Cases 2 & 3
INSERT INTO public.rsvp_attendees (
    guest_id, first_name, last_name, full_name, is_primary, main_course_id, side_ids
) VALUES
    -- Caso 2 (2 / 2 confirmados: Titular + Acompañante Uno)
    ('33333333-3333-4333-8333-333333333302', 'Nombre', 'Invitado Dos',    'Nombre Invitado Dos',    TRUE,  'lomito-vino',     ARRAY['pure-papas', 'vegetales-salte']),
    ('33333333-3333-4333-8333-333333333302', 'Nombre', 'Acompañante Uno', 'Nombre Acompañante Uno', FALSE, 'salmon-hierbas',  ARRAY['ensalada-cesar', 'papas-gratin']),

    -- Caso 3 (2 / 3 confirmados: Titular + Acompañante Uno; queda 1 acompañante pendiente por confirmar)
    ('33333333-3333-4333-8333-333333333303', 'Nombre', 'Invitado Tres',   'Nombre Invitado Tres',   TRUE,  'pollo-parmesana', ARRAY['arroz-almendras', 'ensalada-cesar']),
    ('33333333-3333-4333-8333-333333333303', 'Nombre', 'Acompañante Dos', 'Nombre Acompañante Dos', FALSE, 'risotto-hongos',  ARRAY['vegetales-salte', 'papas-gratin']);

-- 8.10 7 Curated Event Stock Photos (approved; activates 6-photo preview + "Ver todas (7)")
INSERT INTO public.gallery_photos (guest_id, storage_path, status, created_at) VALUES
    ('33333333-3333-4333-8333-333333333302', 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80', 'approved', now() - interval '7 hours'),
    ('33333333-3333-4333-8333-333333333302', 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80', 'approved', now() - interval '6 hours'),
    ('33333333-3333-4333-8333-333333333303', 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80', 'approved', now() - interval '5 hours'),
    ('33333333-3333-4333-8333-333333333303', 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80', 'approved', now() - interval '4 hours'),
    ('33333333-3333-4333-8333-333333333301', 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&w=1200&q=80', 'approved', now() - interval '3 hours'),
    ('33333333-3333-4333-8333-333333333302', 'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1200&q=80', 'approved', now() - interval '2 hours'),
    ('33333333-3333-4333-8333-333333333303', 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?auto=format&fit=crop&w=1200&q=80', 'approved', now() - interval '1 hour');

COMMIT;

-- Verification summary
SELECT
    (SELECT count(*) FROM public.guests)         AS demo_guests_3,
    (SELECT count(*) FROM public.rsvp_attendees) AS demo_confirmed_attendees_4,
    (SELECT count(*) FROM public.gallery_photos) AS demo_stock_photos_7;
