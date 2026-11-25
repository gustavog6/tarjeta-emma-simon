-- ============================================================
-- Migration 010 — Full Snapshot Backup of Current Live Data
-- Execute in: Supabase Dashboard → SQL Editor (AFTER running 009)
--
-- Creates an isolated `event_backup` schema (not exposed to the
-- public API, with RLS enabled on all tables) and copies 100% of
-- current rows, UUIDs, tokens, timestamps, and settings verbatim.
--
-- Re-running this script overwrites the snapshot with the current
-- live state of `public.*`. Use `012_restore_backed_up_data.sql`
-- whenever you want to restore this exact snapshot.
-- ============================================================

BEGIN;

-- ─── 1. Verify that Migration 009 is already applied ─────────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'event_settings'
    ) THEN
        RAISE EXCEPTION 'Debes ejecutar primero supabase/009_agnostic_event_schema.sql antes de guardar el respaldo.';
    END IF;
END $$;

-- ─── 2. Create private backup schema (isolated from PostgREST) ───────
CREATE SCHEMA IF NOT EXISTS event_backup;
REVOKE ALL ON SCHEMA event_backup FROM PUBLIC, anon, authenticated;

-- ─── 3. Recreate clean snapshot tables with exact column types ───────
DROP TABLE IF EXISTS event_backup.snapshot_metadata;
DROP TABLE IF EXISTS event_backup.gallery_photos;
DROP TABLE IF EXISTS event_backup.rsvp_attendees;
DROP TABLE IF EXISTS event_backup.guests;
DROP TABLE IF EXISTS event_backup.special_mentions;
DROP TABLE IF EXISTS event_backup.payment_accounts;
DROP TABLE IF EXISTS event_backup.schedule_items;
DROP TABLE IF EXISTS event_backup.event_locations;
DROP TABLE IF EXISTS event_backup.menu_sides;
DROP TABLE IF EXISTS event_backup.menu_main_courses;
DROP TABLE IF EXISTS event_backup.guest_groups;
DROP TABLE IF EXISTS event_backup.event_settings;

CREATE TABLE event_backup.event_settings    (LIKE public.event_settings    INCLUDING DEFAULTS);
CREATE TABLE event_backup.guest_groups      (LIKE public.guest_groups      INCLUDING DEFAULTS);
CREATE TABLE event_backup.menu_main_courses (LIKE public.menu_main_courses INCLUDING DEFAULTS);
CREATE TABLE event_backup.menu_sides        (LIKE public.menu_sides        INCLUDING DEFAULTS);
CREATE TABLE event_backup.event_locations   (LIKE public.event_locations   INCLUDING DEFAULTS);
CREATE TABLE event_backup.schedule_items    (LIKE public.schedule_items    INCLUDING DEFAULTS);
CREATE TABLE event_backup.payment_accounts  (LIKE public.payment_accounts  INCLUDING DEFAULTS);
CREATE TABLE event_backup.special_mentions  (LIKE public.special_mentions  INCLUDING DEFAULTS);
CREATE TABLE event_backup.guests            (LIKE public.guests            INCLUDING DEFAULTS);
CREATE TABLE event_backup.rsvp_attendees    (LIKE public.rsvp_attendees    INCLUDING DEFAULTS);
CREATE TABLE event_backup.gallery_photos    (LIKE public.gallery_photos    INCLUDING DEFAULTS);

CREATE TABLE event_backup.snapshot_metadata (
    id                 INT PRIMARY KEY DEFAULT 1,
    saved_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    guests_count       INT NOT NULL,
    attendees_count    INT NOT NULL,
    photos_count       INT NOT NULL,
    groups_count       INT NOT NULL,
    locations_count    INT NOT NULL
);

-- Enable RLS on every backup table (zero policies = nobody via API can read/write)
ALTER TABLE event_backup.event_settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_backup.guest_groups      ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_backup.menu_main_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_backup.menu_sides        ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_backup.event_locations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_backup.schedule_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_backup.payment_accounts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_backup.special_mentions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_backup.guests            ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_backup.rsvp_attendees    ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_backup.gallery_photos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_backup.snapshot_metadata ENABLE ROW LEVEL SECURITY;

-- ─── 4. Copy 100% of current live rows verbatim ──────────────────────
INSERT INTO event_backup.event_settings    SELECT * FROM public.event_settings;
INSERT INTO event_backup.guest_groups      SELECT * FROM public.guest_groups;
INSERT INTO event_backup.menu_main_courses SELECT * FROM public.menu_main_courses;
INSERT INTO event_backup.menu_sides        SELECT * FROM public.menu_sides;
INSERT INTO event_backup.event_locations   SELECT * FROM public.event_locations;
INSERT INTO event_backup.schedule_items    SELECT * FROM public.schedule_items;
INSERT INTO event_backup.payment_accounts  SELECT * FROM public.payment_accounts;
INSERT INTO event_backup.special_mentions  SELECT * FROM public.special_mentions;
INSERT INTO event_backup.guests            SELECT * FROM public.guests;
INSERT INTO event_backup.rsvp_attendees    SELECT * FROM public.rsvp_attendees;
INSERT INTO event_backup.gallery_photos    SELECT * FROM public.gallery_photos;

INSERT INTO event_backup.snapshot_metadata (
    id, saved_at, guests_count, attendees_count, photos_count, groups_count, locations_count
)
VALUES (
    1,
    now(),
    (SELECT count(*) FROM event_backup.guests),
    (SELECT count(*) FROM event_backup.rsvp_attendees),
    (SELECT count(*) FROM event_backup.gallery_photos),
    (SELECT count(*) FROM event_backup.guest_groups),
    (SELECT count(*) FROM event_backup.event_locations)
);

COMMIT;

-- Verification output in SQL Editor
SELECT * FROM event_backup.snapshot_metadata;
