-- ============================================================
-- Migration 012 — Restore Original Data from `event_backup`
-- Execute in: Supabase Dashboard → SQL Editor
--
-- Restores the exact snapshot captured by `010_backup_current_data.sql`
-- (all original settings, groups, venues, menu, guests, tokens,
-- RSVP confirmations, and gallery photo records).
-- ============================================================

BEGIN;

-- ─── 1. Verify that a valid snapshot exists in `event_backup` ────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'event_backup' AND table_name = 'event_settings'
    ) OR (SELECT count(*) FROM event_backup.event_settings) = 0 THEN
        RAISE EXCEPTION 'No se encontró un respaldo válido en event_backup. Cancela la operación.';
    END IF;
END $$;

-- ─── 2. Clear stress-test records cleanly ────────────────────────────
TRUNCATE TABLE
    public.rsvp_attendees,
    public.gallery_photos,
    public.guests,
    public.guest_groups,
    public.menu_main_courses,
    public.menu_sides,
    public.event_locations,
    public.schedule_items,
    public.payment_accounts,
    public.special_mentions,
    public.event_settings
RESTART IDENTITY CASCADE;

-- ─── 3. Restore all tables in foreign-key dependency order ───────────
INSERT INTO public.event_settings    SELECT * FROM event_backup.event_settings;
INSERT INTO public.guest_groups      SELECT * FROM event_backup.guest_groups;
INSERT INTO public.menu_main_courses SELECT * FROM event_backup.menu_main_courses;
INSERT INTO public.menu_sides        SELECT * FROM event_backup.menu_sides;
INSERT INTO public.event_locations   SELECT * FROM event_backup.event_locations;
INSERT INTO public.schedule_items    SELECT * FROM event_backup.schedule_items;
INSERT INTO public.payment_accounts  SELECT * FROM event_backup.payment_accounts;
INSERT INTO public.special_mentions  SELECT * FROM event_backup.special_mentions;
INSERT INTO public.guests            SELECT * FROM event_backup.guests;
INSERT INTO public.rsvp_attendees    SELECT * FROM event_backup.rsvp_attendees;

-- Restore `confirmed_at` timestamps verbatim from backup (since AFTER INSERT trigger on rsvp_attendees updates confirmed_at if null)
UPDATE public.guests g
SET confirmed_at = b.confirmed_at
FROM event_backup.guests b
WHERE g.id = b.id;

INSERT INTO public.gallery_photos    SELECT * FROM event_backup.gallery_photos;

COMMIT;

-- Verification output
SELECT
    (SELECT count(*) FROM public.guests)         AS restored_guests,
    (SELECT count(*) FROM public.rsvp_attendees) AS restored_attendees,
    (SELECT count(*) FROM public.gallery_photos) AS restored_photos,
    (SELECT count(*) FROM public.guest_groups)   AS restored_groups;
