-- ============================================================
-- Migración 001 — Tablas iniciales para invitación digital
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- ─── Permisos en el Schema public ─────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- ─── Tabla: invitados ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS invitados (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token         UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    nombre        TEXT NOT NULL,
    apellido      TEXT NOT NULL,
    email         TEXT,
    telefono      TEXT,
    grupo         TEXT NOT NULL CHECK (grupo IN ('novia', 'novio')),
    slots         INT  NOT NULL DEFAULT 1,          -- personas que puede registrar (incluido él)
    puede_subir_fotos BOOLEAN NOT NULL DEFAULT TRUE,
    confirmed_at  TIMESTAMPTZ,                      -- NULL = no confirmado
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Tabla: confirmaciones ────────────────────────────────
CREATE TABLE IF NOT EXISTS confirmaciones (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitado_id     UUID NOT NULL REFERENCES invitados(id) ON DELETE CASCADE,
    nombre_completo TEXT NOT NULL,
    es_titular      BOOLEAN NOT NULL DEFAULT FALSE,
    plato_fuerte    TEXT,
    contornos       TEXT[] DEFAULT '{}',
    regalo_id       TEXT,                           -- item de mesa de regalos (opcional)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Tabla: fotos ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fotos (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitado_id   UUID NOT NULL REFERENCES invitados(id) ON DELETE CASCADE,
    storage_path  TEXT NOT NULL,                    -- ruta en Supabase Storage
    estado        TEXT NOT NULL DEFAULT 'pendiente'
                  CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Índices ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_invitados_token     ON invitados(token);
CREATE INDEX IF NOT EXISTS idx_confirmaciones_inv  ON confirmaciones(invitado_id);
CREATE INDEX IF NOT EXISTS idx_fotos_estado        ON fotos(estado);
CREATE INDEX IF NOT EXISTS idx_fotos_inv           ON fotos(invitado_id);

-- ─── Permisos a nivel de Tablas (GRANT) ───────────────────
-- Necesario para que Postgres permita al rol público consultar y administrar las tablas
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE invitados TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE confirmaciones TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE fotos TO anon, authenticated;

-- Permisos totales a service_role (Admin)
GRANT ALL ON TABLE invitados TO service_role;
GRANT ALL ON TABLE confirmaciones TO service_role;
GRANT ALL ON TABLE fotos TO service_role;

-- ============================================================
-- RLS — Row Level Security
-- ============================================================

ALTER TABLE invitados      ENABLE ROW LEVEL SECURITY;
ALTER TABLE confirmaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos          ENABLE ROW LEVEL SECURITY;

-- ─── Políticas: invitados ─────────────────────────────────
DROP POLICY IF EXISTS "Leer invitado por token" ON invitados;
DROP POLICY IF EXISTS "Invitado actualiza confirmed_at" ON invitados;
DROP POLICY IF EXISTS "Admin puede gestionar invitados" ON invitados;
DROP POLICY IF EXISTS "Admin gestiona invitados" ON invitados;

CREATE POLICY "Admin gestiona invitados"
    ON invitados FOR ALL
    TO anon, authenticated, service_role
    USING (TRUE)
    WITH CHECK (TRUE);

-- ─── Políticas: confirmaciones ────────────────────────────
DROP POLICY IF EXISTS "Insertar confirmacion" ON confirmaciones;
CREATE POLICY "Insertar confirmacion"
    ON confirmaciones FOR INSERT
    TO anon, authenticated
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Leer confirmaciones propias" ON confirmaciones;
CREATE POLICY "Leer confirmaciones propias"
    ON confirmaciones FOR SELECT
    TO anon, authenticated
    USING (TRUE);

DROP POLICY IF EXISTS "Admin gestiona confirmaciones" ON confirmaciones;
CREATE POLICY "Admin gestiona confirmaciones"
    ON confirmaciones FOR ALL
    TO service_role
    USING (TRUE);

-- ─── Políticas: fotos ─────────────────────────────────────
DROP POLICY IF EXISTS "Insertar foto" ON fotos;
CREATE POLICY "Insertar foto"
    ON fotos FOR INSERT
    TO anon, authenticated
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Ver fotos aprobadas" ON fotos;
DROP POLICY IF EXISTS "Permitir leer fotos" ON fotos;
CREATE POLICY "Permitir leer fotos"
    ON fotos FOR SELECT
    TO anon, authenticated
    USING (TRUE);

DROP POLICY IF EXISTS "Admin modera fotos" ON fotos;
DROP POLICY IF EXISTS "Permitir actualizar fotos" ON fotos;
CREATE POLICY "Permitir actualizar fotos"
    ON fotos FOR UPDATE
    TO anon, authenticated
    USING (TRUE)
    WITH CHECK (TRUE);
