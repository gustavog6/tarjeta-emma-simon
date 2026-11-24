-- ============================================================
-- Migración 005 — Grupos de invitados 100% dinámicos
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Agregar columna `grupos` a `configuracion`
ALTER TABLE configuracion
    ADD COLUMN IF NOT EXISTS grupos JSONB NOT NULL DEFAULT '[]';

-- 2. Quitar el CHECK fijo ('novia', 'novio') de `invitados.grupo`
--    y reemplazarlo por una validación de texto no vacío
DO $$
DECLARE
    v_conname TEXT;
BEGIN
    SELECT conname INTO v_conname
    FROM pg_constraint
    WHERE conrelid = 'public.invitados'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%grupo%novia%novio%';

    IF v_conname IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.invitados DROP CONSTRAINT %I', v_conname);
    END IF;
END $$;

ALTER TABLE invitados DROP CONSTRAINT IF EXISTS invitados_grupo_no_vacio;
ALTER TABLE invitados ADD CONSTRAINT invitados_grupo_no_vacio CHECK (length(btrim(grupo)) > 0);

-- 3. Semilla inicial de grupos usando los nombres actuales de los novios
UPDATE configuracion
SET grupos = jsonb_build_array(
    jsonb_build_object(
        'id', 'novia',
        'nombre', COALESCE(novios->'novia'->>'nombre', 'Novia') || ' (Novia)',
        'color', 'pink',
        'whatsapp', COALESCE(novios->'novia'->>'whatsapp', '')
    ),
    jsonb_build_object(
        'id', 'novio',
        'nombre', COALESCE(novios->'novio'->>'nombre', 'Novio') || ' (Novio)',
        'color', 'blue',
        'whatsapp', COALESCE(novios->'novio'->>'whatsapp', '')
    )
)
WHERE id = 'default' AND (grupos IS NULL OR jsonb_array_length(grupos) = 0);
