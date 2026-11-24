-- ============================================================
-- Migración 002 — Storage bucket para galería de fotos
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Asegurar que el bucket 'galeria' sea público para servir imágenes a etiquetas <img>
INSERT INTO storage.buckets (id, name, public)
VALUES ('galeria', 'galeria', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

-- 2. Políticas de acceso en Storage
DROP POLICY IF EXISTS "Upload a galeria" ON storage.objects;
CREATE POLICY "Upload a galeria"
    ON storage.objects FOR INSERT
    TO anon, authenticated
    WITH CHECK (bucket_id = 'galeria');

DROP POLICY IF EXISTS "Leer de galeria" ON storage.objects;
CREATE POLICY "Leer de galeria"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'galeria');

DROP POLICY IF EXISTS "Admin elimina de galeria" ON storage.objects;
CREATE POLICY "Admin elimina de galeria"
    ON storage.objects FOR DELETE
    TO service_role
    USING (bucket_id = 'galeria');
