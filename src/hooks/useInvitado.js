import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useInvitado
 * ───────────────────────────────────────────────
 * Lee el parámetro ?ref= de la URL y consulta la
 * tabla `invitados` en Supabase para obtener los
 * datos del invitado.
 *
 * Estados posibles:
 *   loading: true  → consultando
 *   invitado: obj  → token válido, datos disponibles
 *   invitado: null → token ausente o inválido
 *   error: string  → fallo de red o DB
 */
export function useInvitado() {
    const [invitado, setInvitado] = useState(undefined); // undefined = aún no resuelto
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token  = params.get('ref');

        if (!token) {
            setInvitado(null);
            setLoading(false);
            return;
        }

        // Validar formato UUID básico antes de ir a la DB
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!UUID_REGEX.test(token)) {
            setInvitado(null);
            setLoading(false);
            return;
        }

        async function fetchInvitado() {
            try {
                const { data, error: sbError } = await supabase
                    .from('invitados')
                    .select('*')
                    .eq('token', token)
                    .maybeSingle();

                if (sbError) throw sbError;

                setInvitado(data ?? null); // null si no existe el token
            } catch (err) {
                console.error('[useInvitado]', err);
                setError(err.message ?? 'Error al cargar la invitación');
                setInvitado(null);
            } finally {
                setLoading(false);
            }
        }

        fetchInvitado();
    }, []);

    return { invitado, loading, error };
}
