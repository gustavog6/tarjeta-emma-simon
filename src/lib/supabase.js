import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
// Limpiar automáticamente /rest/v1 o slashes finales si se pegaron por error
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

// Acepta la nueva Publishable Key de Supabase (sb_publishable_...) o la legacy anon key
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn(
        '[Supabase] Variables de entorno no configuradas. ' +
        'Configura VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY en tu archivo .env.'
    );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '');
