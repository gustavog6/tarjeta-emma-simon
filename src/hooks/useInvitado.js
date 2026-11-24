import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useInvitado
 * ───────────────────────────────────────────────
 * Lee el parámetro ?ref= de la URL y consulta el
 * invitado mediante la RPC segura `obtener_invitado`.
 */
export function useInvitado() {
    const [invitado, setInvitado] = useState(undefined);
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

        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!UUID_REGEX.test(token)) {
            setInvitado(null);
            setLoading(false);
            return;
        }

        async function fetchInvitado() {
            try {
                const { data, error: rpcError } = await supabase.rpc('obtener_invitado', {
                    p_token: token,
                });

                if (rpcError) {
                    // Fallback temporal solo si aún no se ha ejecutado 004_integridad.sql
                    if (rpcError.code === 'PGRST202' || rpcError.code === '42883') {
                        const { data: fbData, error: fbError } = await supabase
                            .from('invitados')
                            .select('*')
                            .eq('token', token)
                            .maybeSingle();
                        if (fbError) throw fbError;
                        setInvitado(fbData ?? null);
                        return;
                    }
                    throw rpcError;
                }

                const row = Array.isArray(data) ? data[0] : data;
                setInvitado(row ?? null);
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
