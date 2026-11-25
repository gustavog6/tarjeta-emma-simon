import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useGuestAccess
 * ───────────────────────────────────────────────
 * Reads ?ref=UUID from the URL and fetches the guest
 * plus already confirmed attendees via secure RPCs.
 */
export function useGuestAccess() {
    const [guest, setGuest]         = useState(undefined);
    const [attendees, setAttendees] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(null);

    const fetchGuest = useCallback(async () => {
        const params = new URLSearchParams(window.location.search);
        const token  = params.get('ref');

        if (!token) {
            setGuest(null);
            setAttendees([]);
            setLoading(false);
            return;
        }

        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!UUID_REGEX.test(token)) {
            setGuest(null);
            setAttendees([]);
            setLoading(false);
            return;
        }

        try {
            const { data, error: rpcError } = await supabase.rpc('get_guest_by_token', {
                p_token: token,
            });
            if (rpcError) throw rpcError;

            const row = Array.isArray(data) ? data[0] ?? null : data ?? null;
            setGuest(row);

            if (row) {
                const { data: attData, error: attErr } = await supabase.rpc('get_guest_attendees', {
                    p_token: token,
                });
                setAttendees(!attErr && Array.isArray(attData) ? attData : []);
            } else {
                setAttendees([]);
            }
        } catch (err) {
            console.error('[useGuestAccess]', err);
            setError(err.message ?? 'Error al cargar la invitación');
            setGuest(null);
            setAttendees([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGuest();
    }, [fetchGuest]);

    return { guest, attendees, loading, error, reload: fetchGuest };
}
