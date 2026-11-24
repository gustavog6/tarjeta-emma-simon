-- ============================================================
-- Migración 003 — Configuración Dinámica y slots_totales
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Renombrar la columna slots a slots_totales en invitados
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invitados' AND column_name = 'slots'
    ) THEN
        ALTER TABLE invitados RENAME COLUMN slots TO slots_totales;
    END IF;
END $$;

-- Asegurar que slots_totales no sea nulo (por defecto 0 acompañantes extras)
ALTER TABLE invitados ALTER COLUMN slots_totales SET DEFAULT 0;

-- 2. Crear tabla de configuración dinámica del evento
CREATE TABLE IF NOT EXISTS configuracion (
    id TEXT PRIMARY KEY DEFAULT 'default',
    novios JSONB NOT NULL,
    fecha TIMESTAMPTZ NOT NULL,
    fecha_limite_rsvp TIMESTAMPTZ NOT NULL,
    venues JSONB NOT NULL DEFAULT '[]',
    itinerario JSONB NOT NULL DEFAULT '[]',
    vestimenta JSONB NOT NULL DEFAULT '{"tipo": "Elegante / Casual"}',
    menu JSONB NOT NULL,
    datos_bancarios JSONB NOT NULL DEFAULT '[]',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Permisos y RLS para la tabla configuracion
GRANT SELECT, INSERT, UPDATE ON TABLE configuracion TO anon, authenticated, service_role;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura publica configuracion" ON configuracion;
CREATE POLICY "Lectura publica configuracion"
    ON configuracion FOR SELECT
    TO anon, authenticated, service_role
    USING (TRUE);

DROP POLICY IF EXISTS "Admin actualiza configuracion" ON configuracion;
CREATE POLICY "Admin actualiza configuracion"
    ON configuracion FOR ALL
    TO anon, authenticated, service_role
    USING (TRUE)
    WITH CHECK (TRUE);

-- 4. Semilla inicial de configuración (si no existe la fila 'default')
INSERT INTO configuracion (
    id,
    novios,
    fecha,
    fecha_limite_rsvp,
    venues,
    itinerario,
    vestimenta,
    menu,
    datos_bancarios
)
VALUES (
    'default',
    '{"novia": {"nombre": "Emma", "apellido": "González", "whatsapp": "+584249743171"}, "novio": {"nombre": "Simón", "apellido": "España", "whatsapp": "+584140110568"}}'::jsonb,
    '2026-01-31T11:30:00-04:00'::timestamptz,
    '2026-01-26T23:59:59-04:00'::timestamptz,
    '[{"id": "ceremonia", "tipo": "ceremony", "titulo": "Ceremonia y Recepción", "lugar": "La Llovizna Hotel & Casino", "direccion": "Av. Guayana, Puerto Ordaz, Bolívar", "hora": "11:30 AM", "mapUrl": "https://www.google.com/maps?q=La+Llovizna+Hotel+%26+Casino+Puerto+Ordaz&output=embed", "externalLink": "https://www.google.com/maps/search/?api=1&query=La+Llovizna+Hotel+%26+Casino+Puerto+Ordaz"}]'::jsonb,
    '[{"hora": "11:30 AM", "titulo": "Llegada", "icono": "MapPin"}, {"hora": "12:00 M", "titulo": "Ceremonia Religiosa", "icono": "Church"}, {"hora": "12:45 M", "titulo": "Brindis & Sesión de Fotos", "icono": "Wine"}, {"hora": "01:45 PM", "titulo": "Almuerzo & Celebración", "icono": "Utensils"}]'::jsonb,
    '{"tipo": "Elegante / Casual"}'::jsonb,
    '{"platosFuertes": [{"id": "pollo-grill", "nombre": "Pechuga de pollo al grill"}, {"id": "pollo-limon", "nombre": "Pechuga de pollo al limón"}, {"id": "pollo-parmesana", "nombre": "Pechuga de pollo a la parmesana"}, {"id": "asado-negro", "nombre": "Asado Negro"}, {"id": "pescado-ajillo", "nombre": "Pescado al ajillo"}], "contornos": [{"id": "vegetales", "nombre": "Vegetales salteados"}, {"id": "ensalada", "nombre": "Ensalada verde"}, {"id": "papas-vapor", "nombre": "Papas al vapor"}, {"id": "papas-fritas", "nombre": "Papas fritas"}, {"id": "pure", "nombre": "Puré de papas"}, {"id": "arroz", "nombre": "Arroz"}], "maxContornos": 2}'::jsonb,
    '[{"banco": "Banesco", "tipo": "Pago Móvil", "titular": "Emma González", "telefono": "0424-9743171", "cedula": "26.513.313"}, {"banco": "Banesco", "tipo": "Pago Móvil", "titular": "Simón España", "telefono": "0414-0110568", "cedula": "17.047.573"}, {"banco": "Binance", "tipo": "Binance Pay", "titular": "Emma González", "id": "197734304"}, {"banco": "Binance", "tipo": "Binance Pay", "titular": "Simón España", "id": "1081211093"}]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
