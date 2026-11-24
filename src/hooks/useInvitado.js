import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useInvitado
 * ───────────────────────────────────────────────
 * Lee el parámetro ?ref= de la URL, obtiene el invitado y
 * las confirmaciones ya registradas mediante RPCs seguras.
 */
export function useInvitado() {
    const [invitado, setInvitado]             = useState(undefined);
    const [confirmaciones, setConfirmaciones] = useState([]);
    const [loading, setLoading]               = useState(true);
    const [error, setError]                   = useState(null);

    const fetchInvitado = useCallback(async () => {
        const params = new URLSearchParams(window.location.search);
        const token  = params.get('ref');

        if (!token) {
            setInvitado(null);
            setConfirmaciones([]);
            setLoading(false);
            return;
        }

        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!UUID_REGEX.test(token)) {
            setInvitado(null);
            setConfirmaciones([]);
            setLoading(false);
            return;
        }

        try {
            let row = null;
            const { data, error: rpcError } = await supabase.rpc('obtener_invitado', {
                p_token: token,
            });

            if (rpcError) {
                if (rpcError.code === 'PGRST202' || rpcError.code === '42883') {
                    const { data: fbData, error: fbError } = await supabase
                        .from('invitados')
                        .select('*')
                        .eq('token', token)
                        .maybeSingle();
                    if (fbError) throw fbError;
                    row = fbData ?? null;
                } else {
                    throw rpcError;
                }
            } else {
                row = Array.isArray(data) ? data[0] ?? null : data ?? null;
            }

            setInvitado(row);

            if (row) {
                const { data: confData, error: confErr } = await supabase.rpc(
                    'obtener_confirmaciones_invitado',
                    { p_token: token }
                );
                if (!confErr && Array.isArray(confData)) {
                    setConfirmaciones(confData);
                } else {
                    setConfirmaciones([]);
                }
            } else {
                setConfirmaciones([]);
            }
        } catch (err) {
            console.error('[useInvitado]', err);
            setError(err.message ?? 'Error al cargar la invitación');
            setInvitado(null);
            setConfirmaciones([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInvitado();
    }, [fetchInvitado]);

    return { invitado, confirmaciones, loading, error, reload: fetchInvitado };
}
