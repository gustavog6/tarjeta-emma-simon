-- ============================================================
-- Migration 011 — Wipe All Tables & Seed Max-Limits Stress Test
-- Execute in: Supabase Dashboard → SQL Editor
-- (Run 010_backup_current_data.sql FIRST so your real data is safe!)
--
-- What this script does atomically:
--   1. Wipes 100% of rows across all 11 public tables cleanly.
--   2. Populates `event_settings` pushing every single text field,
--      counter (`max_sides = 6`), and template right up to the
--      maximum visual bounds (`EVENT_LIMITS` / DB CHECK constraints).
--   3. Populates EVERY relational table to its exact maximum row bound:
--        • guest_groups:      6 / 6 (all 6 colors + diverse icons)
--        • event_locations:   4 / 4 (main_venue, reception, livestream, videocall)
--        • schedule_items:    8 / 8 (full timeline with 8 icons)
--        • menu_main_courses: 8 / 8 (50–55 char gourmet titles)
--        • menu_sides:       10 / 10 (35–40 char side dish titles)
--        • payment_accounts:  6 / 6 (3 Pago Móvil + 3 Binance Pay)
--        • special_mentions:  6 / 6 (45–50 char names + 28–30 char roles)
--   4. Seeds 10 diverse invitations (`guests`) with deterministic
--      `?ref=` UUID tokens covering every edge case:
--        • Token ...01: Max capacity (1 + 15 = 16 passes), ALL 16 confirmed
--                       with 40-char names & 6 sides each!
--        • Token ...02: Max capacity (1 + 15 = 16 passes), 0 confirmed
--                       (ready to test RSVP wizard at maximum scale).
--        • Token ...03: Partial confirmation (3 of 6 confirmed, 3 remaining).
--        • Token ...04: Individual pass (1 + 0 = 1), confirmed, no photo permission.
--        • Token ...05: Individual pass (1 + 0 = 1), unconfirmed, with photo permission.
--        • Tokens ...06 to ...10: Couples, companions-only (missing primary row),
--                       and guests across all 6 groups.
--   5. Seeds 15 `gallery_photos` (10 approved > previewMax 6, 3 pending,
--      2 rejected) to stress-test the preview grid, "Ver todas" modal,
--      fullscreen lightbox, and Admin photo moderation tab.
-- ============================================================

BEGIN;

-- ─── 0. Safety check: warn if backup schema does not exist ───────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'event_backup' AND table_name = 'event_settings'
    ) THEN
        RAISE EXCEPTION 'No existe respaldo en event_backup. Ejecuta primero 010_backup_current_data.sql para proteger tus datos actuales.';
    END IF;
END $$;

-- ─── 1. Wipe 100% of records in all public tables ────────────────────
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

-- ─── 2. Insert `event_settings` at Maximum Visual & Character Limits ─
INSERT INTO public.event_settings (
    id,
    event_type,
    primary_host_first_name,        -- max 25
    primary_host_last_name,         -- max 30
    primary_host_phone,             -- max 25
    secondary_host_first_name,      -- max 25
    secondary_host_last_name,       -- max 30
    secondary_host_phone,           -- max 25
    event_date,
    rsvp_deadline,
    dress_code,                     -- max 40
    max_sides,                      -- max 6
    public_url,                     -- max 200
    whatsapp_template,              -- max 600
    rsvp_group_prompt,              -- max 80
    rsvp_whatsapp_intro,            -- max 160
    calendar_title_template,        -- max 80
    calendar_description_template,  -- max 200
    story_badge,                    -- max 40
    story_footer,                   -- max 90
    mentions_section_title,         -- max 45
    special_mentions_title,         -- max 45
    group_a_label,                  -- max 40
    group_a_member_1,               -- max 50
    group_a_member_2,               -- max 50
    group_b_label,                  -- max 40
    group_b_member_1,               -- max 50
    group_b_member_2,               -- max 50
    hero_badge,                     -- max 30
    date_section_title,             -- max 30
    date_weekday_label,             -- max 20
    locations_title,                -- max 35
    locations_subtitle,             -- max 160
    schedule_title,                 -- max 35
    rsvp_title,                     -- max 35
    rsvp_subtitle,                  -- max 180
    contributions_title,            -- max 35
    contributions_subtitle,         -- max 180
    closing_quote,                  -- max 220
    closing_signature,              -- max 60
    footer_note,                    -- max 320
    footer_reference,               -- max 50
    welcome_button_label            -- max 28
) VALUES (
    'default',
    'gala',
    'Maximiliano Alejandro Jr.',                                    -- 25 chars
    'De La Torre Monteverde-Salazar',                               -- 30 chars
    '+584149876543',                                                -- 13 chars
    'Valentina Sofía Alejandra',                                    -- 25 chars
    'Bustamante-Villavicencio Pardo',                               -- 30 chars
    '+584241234567',                                                -- 13 chars
    '2027-06-26T19:30:00-04:00',
    '2027-06-10T23:59:59-04:00',
    'Etiqueta Rigurosa / Gala Formal de Noche',                     -- 40 chars
    6,                                                              -- MAX sides = 6
    'https://emmaysimon.netlify.app',
    '¡Estimado(a) {guest_name}! Será un verdadero honor contar con tu valiosa compañía en nuestra gran velada conmemorativa. Esta invitación exclusiva ha sido reservada especialmente para {passes}. Te agradecemos confirmar asistencia y elegir el menú degustación de cada asistente antes del {rsvp_deadline}. Con todo nuestro aprecio y entusiasmo, {hosts} ✨🥂' || E'\n\n' || 'Enlace personal de acceso:' || E'\n' || '{link}',
    '¿Con cuál delegación, familia o categoría de invitados especiales nos acompañas?', -- 80 chars
    '¡Hola! Confirmo formalmente nuestra asistencia y selección gastronómica para la gran gala de {hosts} ✨🥂',
    'Gran Gala Conmemorativa Anual en Honor a {hosts}',
    'Acompáñanos a celebrar esta velada inolvidable en {venue}. Recuerda presentar tu confirmación digital al ingresar al recinto.',
    '¡GRAN VELADA DE GALA CONMEMORATIVA 2027!',                     -- 40 chars
    '"Cada gran historia merece celebrarse rodeados de quienes hacen extraordinario el camino"', -- 89 chars
    'Con el respaldo y agradecimiento especial a',                  -- 43 chars
    'Invitados de Honor, Padrinos y Comité Central',                -- 45 chars
    'Familia De La Torre Monteverde-Salazar',                       -- 38 chars
    'Dr. Carlos Eduardo De La Torre Monteverde-Salazar',            -- 49 chars
    'Dra. María Fernanda Salazar de De La Torre-Vargas',            -- 49 chars
    'Familia Bustamante-Villavicencio Pardo',                       -- 38 chars
    'Ing. Roberto Alejandro Bustamante-Villavicencio',              -- 47 chars
    'Arq. Carolina Beatriz Pardo de Bustamante-Rojas',              -- 47 chars
    'Gran Recepción & Noche de Gala',                               -- 30 chars
    'Reserva Esta Fecha Inolvidable',                               -- 30 chars
    'Sábado de Gala Anual',                                         -- 20 chars
    'Sedes Presenciales y Transmisiones',                           -- 34 chars
    'Hemos dispuesto espacios presenciales y accesos digitales en vivo para que todos nuestros invitados puedan acompañarnos sin importar la distancia.',
    'Programa Oficial de Actividades',                              -- 31 chars
    'Confirmación Oficial de Asistencia',                           -- 34 chars
    'Por favor confirma los datos de cada asistente y elige su plato principal junto con sus acompañamientos preferidos antes de la fecha límite establecida.',
    'Mesa de Regalos y Aportes Oficiales',                          -- 35 chars
    'Tu presencia es sin duda nuestro mayor privilegio; si deseas realizar un obsequio o aporte especial, ponemos a tu disposición las siguientes cuentas:',
    '"La verdadera elegancia de una celebración reside en el afecto, la alegría compartida y los recuerdos imborrables que construimos junto a las personas más importantes de nuestra vida."',
    'Con profundo cariño, Maximiliano Alejandro & Valentina Sofía', -- 60 chars
    '"Todo tiene su momento oportuno bajo el cielo; hoy celebramos la dicha de coincidir, brindar por los sueños alcanzados y agradecer profundamente a cada familia, amistad y colega que nos acompaña en este capítulo tan luminoso e inolvidable."',
    'Edición Conmemorativa Especial — Caracas, 2027',               -- 46 chars
    'Abrir Invitación Exclusiva'                                    -- 26 chars
);

-- ─── 3. `guest_groups` — MAX 6 / 6 (all 6 colors & diverse icons) ────
INSERT INTO public.guest_groups (id, name, color, icon_key, contact_phone, sort_order) VALUES
    ('familia-anfitrion-a', 'Familia De La Torre Monteverde', 'blue',   'shirt',    '+584149876543', 0),
    ('familia-anfitrion-b', 'Familia Bustamante-Villavicen.', 'pink',   'dress',    '+584241234567', 1),
    ('comite-ejecutivo',    'Comité Ejecutivo Internacional', 'green',  'Star',     '+584129998877', 2),
    ('delegacion-diplomat', 'Delegación Diplomática Invitad', 'purple', 'Sparkles', '+584145556677', 3),
    ('amistades-universid', 'Amistades de toda la Vida VIP',  'amber',  'Wine',     '+584248887766', 4),
    ('prensa-y-protocolo',  'Invitados Especiales Protocolo', 'gray',   'Users',    '+584163334455', 5);

-- ─── 4. `menu_main_courses` — MAX 8 / 8 (50–55 chars each) ───────────
INSERT INTO public.menu_main_courses (id, name, sort_order) VALUES
    ('lomito-trufado',    'Medallón de Lomito en Reducción de Vino Tinto y Trufas', 0),
    ('salmon-nordico',    'Salmón Noruego Glaseado en Miel de Cítricos y Almendra', 1),
    ('pollo-relleno',     'Suprema de Pollo Rellena de Espinacas, Brie y Pistacho', 2),
    ('risotto-hongos',    'Risotto Cremoso de Hongos Porcini con Parmesano Reggia', 3),
    ('cordero-patagon',   'Carré de Cordero Patagónico a las Finas Hierbas Fresca', 4),
    ('mero-caribeno',     'Filete de Mero del Caribe en Salsa de Azafrán y Alcapa', 5),
    ('ravioli-langosta',  'Raviolis Artesanales Rellenos de Langosta a la Mantequ', 6),
    ('opcion-vegana',     'Milhojas Vegano de Berenjena Asada, Quinoa Real y Pesto', 7);

-- ─── 5. `menu_sides` — MAX 10 / 10 (35–40 chars each) ────────────────
INSERT INTO public.menu_sides (id, name, sort_order) VALUES
    ('pure-trufado',      'Puré Rústico de Papas al Aceite Trufado', 0),
    ('esparragos-parr',   'Espárragos Verdes Grillados con Parmesa', 1),
    ('vegetales-glasead', 'Vegetales Baby Glaseados en Mantequilla', 2),
    ('arroz-almendrado',  'Arroz Pilaf Aromático con Almendras Tos', 3),
    ('ensalada-burrata',  'Ensalada Mediterránea con Burrata Fresc', 4),
    ('papas-gratinadas',  'Milhojas de Papas Gratinadas al Gruyère', 5),
    ('champinones-ajill', 'Champiñones Portobello Salteados al Ajo', 6),
    ('platanos-caramelo', 'Tentación de Plátanos Maduros al Vino T', 7),
    ('cuscus-marroqui',   'Cuscús Perla con Frutos Secos y Hierbab', 8),
    ('ensalada-cesar',    'Corazones de Lechuga Romana César Clási', 9);

-- ─── 6. `event_locations` — MAX 4 / 4 (all 4 location types!) ────────
INSERT INTO public.event_locations (
    id, location_type, title, venue_name, address, time_label,
    map_url, external_link, platform, stream_url, access_code, sort_order
) VALUES
    (
        'loc-main-venue',
        'main_venue',
        'Acto Protocolar y Ceremonia Central VIP',
        'Gran Salón Imperial del Palacio Histórico Quinta Esmeralda',
        'Av. Principal de Campo Alegre con Calle Las Mercedes, Nivel Terraza Jardín Norte, Municipio Chacao, Caracas 1060, Venez.',
        '06:30 PM (Puntualidad)',
        'https://www.google.com/maps?q=10.4960,-66.8620&z=16&output=embed',
        'https://maps.google.com/?q=10.4960,-66.8620',
        NULL, NULL, NULL, 0
    ),
    (
        'loc-reception',
        'reception',
        'Banquete de Gala, Brindis y Gran Fiesta',
        'Terraza Panorámica & Jardines del Country Club de Caracas',
        'Av. Principal del Country Club, Entrada Portón Sur con Servicio de Valet Parking Privado, Urbanización Country Club, CCS',
        '08:30 PM a 03:30 AM',
        'https://www.google.com/maps?q=10.5030,-66.8540&z=16&output=embed',
        'https://maps.google.com/?q=10.5030,-66.8540',
        NULL, NULL, NULL, 1
    ),
    (
        'loc-livestream',
        'livestream',
        'Transmisión Multicámara en Vivo Full HD',
        NULL, NULL,
        '06:45 PM (Hora Caracas)',
        NULL, NULL,
        'YouTube Live Oficial Exclusivo 4K',
        'https://www.youtube.com/live',
        NULL, 2
    ),
    (
        'loc-videocall',
        'videocall',
        'Sala Interactiva para Brindis a Distanc.',
        NULL, NULL,
        '08:45 PM (Brindis Global)',
        NULL, NULL,
        'Zoom Empresarial Sala VIP Internacional',
        'https://zoom.us',
        'ID: 894-2027-9999 / Clave: GALA-VIP-2027-INVITADOS',
        3
    );

-- ─── 7. `schedule_items` — MAX 8 / 8 ─────────────────────────────────
INSERT INTO public.schedule_items (id, time_label, title, icon_name, sort_order) VALUES
    ('sch-1', '06:30 PM PUNT.', 'Recepción de Invitados en Alfombra Verde y Cóctel Bienv', 'GlassWater', 0),
    ('sch-2', '07:15 PM PUNT.', 'Ceremonia Central y Palabras de Apertura de Anfitriones', 'Church',     1),
    ('sch-3', '08:00 PM PUNT.', 'Sesión Fotográfica Oficial con Familias y Delegaciones',  'Camera',     2),
    ('sch-4', '08:45 PM PUNT.', 'Brindis de Honor Internacional y Discursos Conmemorativ', 'Wine',       3),
    ('sch-5', '09:30 PM PUNT.', 'Cena de Gala de Cuatro Tiempos y Maridaje Seleccionado',  'Utensils',   4),
    ('sch-6', '11:00 PM PUNT.', 'Presentación Musical Sinfónica en Vivo y Apertura Pista', 'Mic',        5),
    ('sch-7', '12:15 AM PUNT.', 'Corte de Pastel Conmemorativo y Mesa de Dulces de Autor', 'Cake',       6),
    ('sch-8', '01:00 AM PUNT.', 'Gran Hora Loca Temática, Orquesta en Vivo y Fin Fiesta',  'Sparkles',   7);

-- ─── 8. `payment_accounts` — MAX 6 / 6 (Pago Móvil + Binance Pay) ────
INSERT INTO public.payment_accounts (
    id, method_type, institution, account_holder, phone, document_id, external_account_id, sort_order
) VALUES
    ('pay-1', 'Pago Móvil',  'Banco Mercantil Universal (0105)',    'Maximiliano Alejandro De La Torre Monteverde', '+58 414-987-6543', 'V-18.945.672-0', NULL, 0),
    ('pay-2', 'Pago Móvil',  'Banesco Banco Universal C.A. (0134)', 'Valentina Sofía Bustamante-Villavicencio P.',  '+58 424-123-4567', 'V-20.431.889-5', NULL, 1),
    ('pay-3', 'Pago Móvil',  'Banco Provincial BBVA Venez. (0108)', 'Comité Organizador De La Torre & Bustamante',  '+58 412-999-8877', 'J-412987654-3',  NULL, 2),
    ('pay-4', 'Binance Pay', 'Binance Pay Internacional (USDT)',    'Maximiliano Alejandro De La Torre Monteverde', NULL, NULL, 'ID-BINANCE-MAXIMILIANO-2027-VIP', 3),
    ('pay-5', 'Binance Pay', 'Binance Pay Cuenta Secundaria VIP',   'Valentina Sofía Bustamante-Villavicencio P.',  NULL, NULL, 'valentinabustamante.gala@correo.com', 4),
    ('pay-6', 'Binance Pay', 'Binance Pay Tesorería del Evento',    'Fundación Cultural De La Torre & Bustamante',  NULL, NULL, 'PAY-ID-99887766554433221100', 5);

-- ─── 9. `special_mentions` — MAX 6 / 6 ───────────────────────────────
INSERT INTO public.special_mentions (id, name, role, sort_order) VALUES
    ('men-1', 'Emb. Alejandro José Monasterios-Villalba y Señora',  'Padrinos de Honor Principales',  0),
    ('men-2', 'Dra. Beatriz Eugenia Altamirano de Mendoza-Crespo',  'Madrina de Brindis y Protocolo', 1),
    ('men-3', 'Dr. Fernando Ignacio Urdaneta-Palacios Betancourt',  'Orador de Orden Conmemorativo',  2),
    ('men-4', 'Mtro. Sebastián Andrés Covarrubias-Iturriza León',   'Director Sinfónico Invitado',    3),
    ('men-5', 'Lic. Gabriela Victoria Aristeguieta-Lovera Rangel',  'Coordinadora General de Gala',   4),
    ('men-6', 'Ing. Mauricio Esteban Pietri-Boulton Santamaría',    'Testigo Especial de Honor VIP',  5);

-- ─── 10. `guests` — 10 Invitations Covering All Real & Extreme Cases ─
INSERT INTO public.guests (
    id, access_token, first_name, last_name, email, phone,
    group_id, extra_passes, can_upload_photos, confirmed_at
) VALUES
    -- [01] EXTREME MAX: 1 + 15 = 16 passes, ALL 16 confirmed, 40-char first & last names!
    (
        '22222222-2222-4222-8222-222222222201',
        '11111111-1111-4111-8111-111111111101',
        'Juan Carlos Maximiliano De La Santísima',  -- 39 chars (max 40)
        'Fernández-Villavicencio De La Torre-Real', -- 40 chars exact (max 40)
        'juancarlos.fernandez.villavicencio.delegacion@corporativo-ejemplo.org',
        '+58 414-111-2233',
        'familia-anfitrion-a',
        15,   -- MAX extra_passes = 15 (16 total attendees!)
        TRUE,
        now() - interval '3 days'
    ),
    -- [02] EXTREME MAX UNCONFIRMED: 1 + 15 = 16 passes, 0 confirmed (test wizard live!)
    (
        '22222222-2222-4222-8222-222222222202',
        '11111111-1111-4111-8111-111111111102',
        'María Antonieta Guadalupe Del Perpetuo S', -- 40 chars exact
        'Bustamante-Aristeguieta De Los Ángeles V', -- 40 chars exact
        'maria.antonieta.bustamante.aristeguieta@familia-ejemplo.com',
        '+58 424-222-3344',
        'familia-anfitrion-b',
        15,
        TRUE,
        NULL
    ),
    -- [03] PARTIAL RSVP: 1 + 5 = 6 passes, 3 confirmed, 3 still available!
    (
        '22222222-2222-4222-8222-222222222203',
        '11111111-1111-4111-8111-111111111103',
        'Ricardo Andrés',
        'Mendoza-Iturriza',
        'ricardo.mendoza@ejecutivo-ejemplo.com',
        '+58 412-333-4455',
        'comite-ejecutivo',
        5,
        TRUE,
        now() - interval '2 days'
    ),
    -- [04] SINGLE PASS CONFIRMED + NO PHOTO UPLOAD PERMISSION
    (
        '22222222-2222-4222-8222-222222222204',
        '11111111-1111-4111-8111-111111111104',
        'Claudia Sofía',
        'Zuloaga-Pietri',
        'claudia.zuloaga@diplomacia-ejemplo.int',
        '+58 414-444-5566',
        'delegacion-diplomat',
        0,
        FALSE,
        now() - interval '1 day'
    ),
    -- [05] SINGLE PASS UNCONFIRMED + PHOTO UPLOAD ALLOWED
    (
        '22222222-2222-4222-8222-222222222205',
        '11111111-1111-4111-8111-111111111105',
        'Esteban Gabriel',
        'Oropeza-Lovera',
        NULL,
        '+58 424-555-6677',
        'amistades-universid',
        0,
        TRUE,
        NULL
    ),
    -- [06] COUPLE CONFIRMED (2 / 2) in Group 6 (`prensa-y-protocolo`)
    (
        '22222222-2222-4222-8222-222222222206',
        '11111111-1111-4111-8111-111111111106',
        'Verónica Isabel',
        'Santamaría-Rojas',
        'veronica.santamaria@prensa-ejemplo.com',
        '+58 416-666-7788',
        'prensa-y-protocolo',
        1,
        TRUE,
        now() - interval '18 hours'
    ),
    -- [07] COMPANIONS ONLY (primary guest deleted/absent, 2 companions confirmed out of 4)
    (
        '22222222-2222-4222-8222-222222222207',
        '11111111-1111-4111-8111-111111111107',
        'Gustavo Adolfo',
        'Casanova-Boulton',
        'gustavo.casanova@ejemplo.com',
        '+58 414-777-8899',
        'comite-ejecutivo',
        3,
        TRUE,
        now() - interval '12 hours'
    ),
    -- [08] FAMILY OF 4 FULLY CONFIRMED (Group 2)
    (
        '22222222-2222-4222-8222-222222222208',
        '11111111-1111-4111-8111-111111111108',
        'Patricia Elena',
        'Betancourt-Crespo',
        'patricia.betancourt@ejemplo.com',
        '+58 424-888-9900',
        'familia-anfitrion-b',
        3,
        TRUE,
        now() - interval '8 hours'
    ),
    -- [09] VIP DELEGATION OF 5 UNCONFIRMED (Group 4)
    (
        '22222222-2222-4222-8222-222222222209',
        '11111111-1111-4111-8111-111111111109',
        'Emb. Henrik Wilhelm',
        'Lindqvist-Söderberg',
        'henrik.lindqvist@embassy-example.se',
        '+46 70-123-4567',
        'delegacion-diplomat',
        4,
        FALSE,
        NULL
    ),
    -- [10] FRIENDS GROUP CONFIRMED (3 / 3 in Group 5)
    (
        '22222222-2222-4222-8222-222222222210',
        '11111111-1111-4111-8111-111111111110',
        'Daniela Carolina',
        'Urdaneta-Monagas',
        'daniela.urdaneta@ejemplo.com',
        '+58 412-101-2020',
        'amistades-universid',
        2,
        TRUE,
        now() - interval '4 hours'
    );

-- ─── 11. `rsvp_attendees` — Full 16-pass stress group + diverse menus ─

-- 11a. All 16 attendees for Guest [01] (each choosing 6 sides = max_sides!)
INSERT INTO public.rsvp_attendees (
    guest_id, first_name, last_name, full_name, is_primary, main_course_id, side_ids
) VALUES
    (
        '22222222-2222-4222-8222-222222222201',
        'Juan Carlos Maximiliano De La Santísima',
        'Fernández-Villavicencio De La Torre-Real',
        'Juan Carlos Maximiliano De La Santísima Fernández-Villavicencio De La Torre-Real',
        TRUE,
        'lomito-trufado',
        ARRAY['pure-trufado','esparragos-parr','vegetales-glasead','ensalada-burrata','papas-gratinadas','champinones-ajill']
    );

INSERT INTO public.rsvp_attendees (
    guest_id, first_name, last_name, full_name, is_primary, main_course_id, side_ids
)
SELECT
    '22222222-2222-4222-8222-222222222201'::UUID,
    'Acompañante Distinguido Número ' || lpad(n::text, 2, '0'),
    'Fernández-Villavicencio De La Torre',
    'Acompañante Distinguido Número ' || lpad(n::text, 2, '0') || ' Fernández-Villavicencio De La Torre',
    FALSE,
    (ARRAY[
        'lomito-trufado','salmon-nordico','pollo-relleno','risotto-hongos',
        'cordero-patagon','mero-caribeno','ravioli-langosta','opcion-vegana'
    ])[((n - 1) % 8) + 1],
    ARRAY['pure-trufado','esparragos-parr','arroz-almendrado','ensalada-burrata','cuscus-marroqui','ensalada-cesar']
FROM generate_series(1, 15) AS n;

-- 11b. Partial confirmation for Guest [03] (3 of 6 passes confirmed)
INSERT INTO public.rsvp_attendees (
    guest_id, first_name, last_name, full_name, is_primary, main_course_id, side_ids
) VALUES
    ('22222222-2222-4222-8222-222222222203', 'Ricardo Andrés', 'Mendoza-Iturriza', 'Ricardo Andrés Mendoza-Iturriza', TRUE, 'cordero-patagon', ARRAY['pure-trufado','esparragos-parr','platanos-caramelo']),
    ('22222222-2222-4222-8222-222222222203', 'Elena Victoria', 'Gómez de Mendoza', 'Elena Victoria Gómez de Mendoza', FALSE, 'salmon-nordico', ARRAY['vegetales-glasead','ensalada-burrata']),
    ('22222222-2222-4222-8222-222222222203', 'Santiago Andrés', 'Mendoza Gómez', 'Santiago Andrés Mendoza Gómez', FALSE, 'pollo-relleno', ARRAY['papas-gratinadas','arroz-almendrado']);

-- 11c. Single pass for Guest [04]
INSERT INTO public.rsvp_attendees (
    guest_id, first_name, last_name, full_name, is_primary, main_course_id, side_ids
) VALUES
    ('22222222-2222-4222-8222-222222222204', 'Claudia Sofía', 'Zuloaga-Pietri', 'Claudia Sofía Zuloaga-Pietri', TRUE, 'ravioli-langosta', ARRAY['ensalada-burrata','esparragos-parr']);

-- 11d. Couple for Guest [06]
INSERT INTO public.rsvp_attendees (
    guest_id, first_name, last_name, full_name, is_primary, main_course_id, side_ids
) VALUES
    ('22222222-2222-4222-8222-222222222206', 'Verónica Isabel', 'Santamaría-Rojas', 'Verónica Isabel Santamaría-Rojas', TRUE, 'mero-caribeno', ARRAY['arroz-almendrado','platanos-caramelo']),
    ('22222222-2222-4222-8222-222222222206', 'Alejandro Miguel', 'Rivas- Calderón', 'Alejandro Miguel Rivas- Calderón', FALSE, 'lomito-trufado', ARRAY['pure-trufado','champinones-ajill']);

-- 11e. Companions-only for Guest [07] (`is_primary = FALSE` for both -> tests "+ Agregar Titular" button in Admin!)
INSERT INTO public.rsvp_attendees (
    guest_id, first_name, last_name, full_name, is_primary, main_course_id, side_ids
) VALUES
    ('22222222-2222-4222-8222-222222222207', 'Camila Eugenia', 'Casanova-Boulton', 'Camila Eugenia Casanova-Boulton', FALSE, 'opcion-vegana', ARRAY['cuscus-marroqui','vegetales-glasead']),
    ('22222222-2222-4222-8222-222222222207', 'Rodrigo Ignacio', 'Casanova-Boulton', 'Rodrigo Ignacio Casanova-Boulton', FALSE, 'risotto-hongos', ARRAY['ensalada-cesar']);

-- 11f. Family of 4 for Guest [08]
INSERT INTO public.rsvp_attendees (
    guest_id, first_name, last_name, full_name, is_primary, main_course_id, side_ids
) VALUES
    ('22222222-2222-4222-8222-222222222208', 'Patricia Elena', 'Betancourt-Crespo', 'Patricia Elena Betancourt-Crespo', TRUE, 'salmon-nordico', ARRAY['esparragos-parr','ensalada-burrata']),
    ('22222222-2222-4222-8222-222222222208', 'Luis Guillermo', 'Palacios-Herrera', 'Luis Guillermo Palacios-Herrera', FALSE, 'lomito-trufado', ARRAY['papas-gratinadas','champinones-ajill']),
    ('22222222-2222-4222-8222-222222222208', 'Sofía Valentina', 'Palacios Betancourt', 'Sofía Valentina Palacios Betancourt', FALSE, 'pollo-relleno', ARRAY['pure-trufado','arroz-almendrado']),
    ('22222222-2222-4222-8222-222222222208', 'Mateo Sebastián', 'Palacios Betancourt', 'Mateo Sebastián Palacios Betancourt', FALSE, 'pollo-relleno', ARRAY['papas-gratinadas','platanos-caramelo']);

-- 11g. Friends group of 3 for Guest [10]
INSERT INTO public.rsvp_attendees (
    guest_id, first_name, last_name, full_name, is_primary, main_course_id, side_ids
) VALUES
    ('22222222-2222-4222-8222-222222222210', 'Daniela Carolina', 'Urdaneta-Monagas', 'Daniela Carolina Urdaneta-Monagas', TRUE, 'risotto-hongos', ARRAY['ensalada-burrata','champinones-ajill','esparragos-parr']),
    ('22222222-2222-4222-8222-222222222210', 'Andrés Eduardo', 'Marcano-Salcedo', 'Andrés Eduardo Marcano-Salcedo', FALSE, 'cordero-patagon', ARRAY['pure-trufado','vegetales-glasead','papas-gratinadas']),
    ('22222222-2222-4222-8222-222222222210', 'Mariana Lucía', 'Quintero-Vargas', 'Mariana Lucía Quintero-Vargas', FALSE, 'mero-caribeno', ARRAY['cuscus-marroqui','ensalada-cesar']);

-- ─── 12. `gallery_photos` — 15 Photos (10 approved, 3 pending, 2 rejected) ─
INSERT INTO public.gallery_photos (guest_id, storage_path, status, created_at) VALUES
    -- 10 Approved photos (exceeds previewMax = 6 so "Ver todas las fotos (10)" modal appears!)
    ('22222222-2222-4222-8222-222222222201', 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80', 'approved', now() - interval '10 hours'),
    ('22222222-2222-4222-8222-222222222203', 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80', 'approved', now() - interval '9 hours'),
    ('22222222-2222-4222-8222-222222222206', 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80', 'approved', now() - interval '8 hours'),
    ('22222222-2222-4222-8222-222222222208', 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80', 'approved', now() - interval '7 hours'),
    ('22222222-2222-4222-8222-222222222210', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80', 'approved', now() - interval '6 hours'),
    ('22222222-2222-4222-8222-222222222201', 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1200&q=80', 'approved', now() - interval '5 hours'),
    ('22222222-2222-4222-8222-222222222203', 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1200&q=80', 'approved', now() - interval '4 hours'),
    ('22222222-2222-4222-8222-222222222207', 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80', 'approved', now() - interval '3 hours'),
    ('22222222-2222-4222-8222-222222222208', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80', 'approved', now() - interval '2 hours'),
    ('22222222-2222-4222-8222-222222222210', 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80', 'approved', now() - interval '1 hour'),
    -- 3 Pending photos (appear in Admin "Fotos (3 pendientes)")
    ('22222222-2222-4222-8222-222222222202', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80', 'pending',  now() - interval '45 minutes'),
    ('22222222-2222-4222-8222-222222222205', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80', 'pending',  now() - interval '30 minutes'),
    ('22222222-2222-4222-8222-222222222206', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80', 'pending',  now() - interval '15 minutes'),
    -- 2 Rejected photos
    ('22222222-2222-4222-8222-222222222207', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80', 'rejected', now() - interval '20 minutes'),
    ('22222222-2222-4222-8222-222222222201', 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80', 'rejected', now() - interval '10 minutes');

COMMIT;

-- Summary of stress-test records inserted
SELECT
    (SELECT count(*) FROM public.guest_groups)      AS groups_6_of_6,
    (SELECT count(*) FROM public.event_locations)   AS locations_4_of_4,
    (SELECT count(*) FROM public.schedule_items)    AS schedule_8_of_8,
    (SELECT count(*) FROM public.menu_main_courses) AS main_courses_8_of_8,
    (SELECT count(*) FROM public.menu_sides)        AS sides_10_of_10,
    (SELECT count(*) FROM public.payment_accounts)  AS accounts_6_of_6,
    (SELECT count(*) FROM public.special_mentions)  AS mentions_6_of_6,
    (SELECT count(*) FROM public.guests)            AS guests_total,
    (SELECT count(*) FROM public.rsvp_attendees)    AS attendees_total,
    (SELECT count(*) FROM public.gallery_photos)    AS photos_total;
