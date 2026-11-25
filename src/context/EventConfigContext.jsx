import React, { createContext, useContext, useState, useEffect } from 'react';
import { defaultEventSettings } from '../config/defaultEventSettings';
import { supabase } from '../lib/supabase';
import { formatDbError } from '../utils/errorMessages';

const EventConfigContext = createContext({
    config: defaultEventSettings,
    loading: false,
    saveConfig: async () => ({ success: false }),
    reloadConfig: async () => {},
});

/**
 * Syncs a relational child table while respecting min/max row triggers & FKs:
 * 1. UPSERT current rows first (prevents dipping below minimum)
 * 2. DELETE removed IDs afterwards
 */
async function syncRelationalTable(tableName, rows) {
    const { data: existing, error: fetchErr } = await supabase.from(tableName).select('id');
    if (fetchErr) throw fetchErr;

    const existingIds = (existing || []).map((r) => r.id);
    const nextIds = new Set(rows.map((r) => r.id));
    const toDelete = existingIds.filter((id) => !nextIds.has(id));

    if (rows.length > 0) {
        const { error: upsertErr } = await supabase.from(tableName).upsert(rows, { onConflict: 'id' });
        if (upsertErr) throw upsertErr;
    }

    for (const id of toDelete) {
        const { error: delErr } = await supabase.from(tableName).delete().eq('id', id);
        if (delErr) throw delErr;
    }
}

export const EventConfigProvider = ({ children }) => {
    const [config, setConfig] = useState(defaultEventSettings);
    const [loading, setLoading] = useState(true);

    const loadConfigFromDB = async () => {
        try {
            if (!supabase) return;

            const [
                settingsRes,
                groupsRes,
                mainCoursesRes,
                sidesRes,
                locationsRes,
                scheduleRes,
                accountsRes,
                mentionsRes,
            ] = await Promise.all([
                supabase.from('event_settings').select('*').eq('id', 'default').maybeSingle(),
                supabase.from('guest_groups').select('*').order('sort_order', { ascending: true }),
                supabase.from('menu_main_courses').select('*').order('sort_order', { ascending: true }),
                supabase.from('menu_sides').select('*').order('sort_order', { ascending: true }),
                supabase.from('event_locations').select('*').order('sort_order', { ascending: true }),
                supabase.from('schedule_items').select('*').order('sort_order', { ascending: true }),
                supabase.from('payment_accounts').select('*').order('sort_order', { ascending: true }),
                supabase.from('special_mentions').select('*').order('sort_order', { ascending: true }),
            ]);

            if (settingsRes.error) {
                console.warn('[EventConfigContext] Could not load event_settings:', settingsRes.error.message);
                return;
            }

            const d = settingsRes.data;
            if (!d) return;

            setConfig((prev) => ({
                ...prev,
                eventType: d.event_type || prev.eventType,
                publicUrl: d.public_url || prev.publicUrl,
                whatsappTemplate: d.whatsapp_template || prev.whatsappTemplate,
                hosts: {
                    primary: {
                        firstName: d.primary_host_first_name ?? '',
                        lastName: d.primary_host_last_name ?? '',
                        phone: d.primary_host_phone ?? '',
                    },
                    secondary: {
                        firstName: d.secondary_host_first_name ?? '',
                        lastName: d.secondary_host_last_name ?? '',
                        phone: d.secondary_host_phone ?? '',
                    },
                },
                eventDate: d.event_date || prev.eventDate,
                rsvpDeadline: d.rsvp_deadline || prev.rsvpDeadline,
                dressCode: { label: d.dress_code ?? '' },
                featuredGroups: {
                    sectionTitle: d.mentions_section_title ?? prev.featuredGroups.sectionTitle,
                    groupA: {
                        label: d.group_a_label ?? '',
                        member1: d.group_a_member_1 ?? '',
                        member2: d.group_a_member_2 ?? '',
                    },
                    groupB: {
                        label: d.group_b_label ?? '',
                        member1: d.group_b_member_1 ?? '',
                        member2: d.group_b_member_2 ?? '',
                    },
                },
                specialMentions: {
                    title: d.special_mentions_title ?? prev.specialMentions.title,
                    items:
                        !mentionsRes.error && Array.isArray(mentionsRes.data)
                            ? mentionsRes.data.map((m) => ({
                                  id: m.id,
                                  name: m.name,
                                  role: m.role,
                              }))
                            : prev.specialMentions.items,
                },
                copy: {
                    hero: { badge: d.hero_badge ?? '' },
                    dateSection: {
                        title: d.date_section_title ?? prev.copy.dateSection.title,
                        weekdayLabel: d.date_weekday_label ?? '',
                    },
                    locations: {
                        title: d.locations_title ?? prev.copy.locations.title,
                        subtitle: d.locations_subtitle ?? '',
                    },
                    schedule: {
                        title: d.schedule_title ?? prev.copy.schedule.title,
                    },
                    rsvp: {
                        title: d.rsvp_title ?? prev.copy.rsvp.title,
                        subtitle: d.rsvp_subtitle ?? '',
                        groupPrompt: d.rsvp_group_prompt ?? prev.copy.rsvp.groupPrompt,
                        whatsappIntro: d.rsvp_whatsapp_intro ?? prev.copy.rsvp.whatsappIntro,
                    },
                    contributions: {
                        title: d.contributions_title ?? prev.copy.contributions.title,
                        subtitle: d.contributions_subtitle ?? '',
                    },
                    closing: {
                        quote: d.closing_quote ?? '',
                        signature: d.closing_signature ?? '',
                    },
                    footer: {
                        note: d.footer_note ?? '',
                        reference: d.footer_reference ?? '',
                    },
                    welcome: {
                        buttonLabel: d.welcome_button_label ?? prev.copy.welcome.buttonLabel,
                    },
                    sharing: {
                        calendarTitleTemplate:
                            d.calendar_title_template ?? prev.copy.sharing.calendarTitleTemplate,
                        calendarDescriptionTemplate:
                            d.calendar_description_template ?? prev.copy.sharing.calendarDescriptionTemplate,
                        storyBadge: d.story_badge ?? prev.copy.sharing.storyBadge,
                        storyFooter: d.story_footer ?? prev.copy.sharing.storyFooter,
                    },
                },
                groups:
                    !groupsRes.error && Array.isArray(groupsRes.data) && groupsRes.data.length > 0
                        ? groupsRes.data.map((g) => ({
                              id: g.id,
                              name: g.name,
                              color: g.color,
                              iconKey: g.icon_key || 'Users',
                              contactPhone: g.contact_phone || '',
                          }))
                        : prev.groups,
                menu: {
                    mainCourses:
                        !mainCoursesRes.error && Array.isArray(mainCoursesRes.data)
                            ? mainCoursesRes.data.map((p) => ({ id: p.id, name: p.name }))
                            : prev.menu.mainCourses,
                    sides:
                        !sidesRes.error && Array.isArray(sidesRes.data)
                            ? sidesRes.data.map((s) => ({ id: s.id, name: s.name }))
                            : prev.menu.sides,
                    maxSides: d.max_sides ?? prev.menu.maxSides,
                },
                locations:
                    !locationsRes.error && Array.isArray(locationsRes.data)
                        ? locationsRes.data.map((loc) => ({
                              id: loc.id,
                              locationType: loc.location_type,
                              title: loc.title,
                              venueName: loc.venue_name || '',
                              address: loc.address || '',
                              timeLabel: loc.time_label || '',
                              mapUrl: loc.map_url || '',
                              externalLink: loc.external_link || '',
                              platform: loc.platform || '',
                              streamUrl: loc.stream_url || '',
                              accessCode: loc.access_code || '',
                          }))
                        : prev.locations,
                schedule:
                    !scheduleRes.error && Array.isArray(scheduleRes.data)
                        ? scheduleRes.data.map((it) => ({
                              id: it.id,
                              timeLabel: it.time_label,
                              title: it.title,
                              iconName: it.icon_name,
                          }))
                        : prev.schedule,
                paymentAccounts:
                    !accountsRes.error && Array.isArray(accountsRes.data)
                        ? accountsRes.data.map((acc) => ({
                              id: acc.id,
                              methodType: acc.method_type,
                              institution: acc.institution,
                              accountHolder: acc.account_holder,
                              phone: acc.phone || '',
                              documentId: acc.document_id || '',
                              externalAccountId: acc.external_account_id || '',
                          }))
                        : prev.paymentAccounts,
            }));
        } catch (err) {
            console.error('[EventConfigContext] Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConfigFromDB();
    }, []);

    const saveConfig = async (nextConfig) => {
        try {
            const scalarPayload = {
                id: 'default',
                event_type: nextConfig.eventType || 'wedding',
                primary_host_first_name: nextConfig.hosts?.primary?.firstName?.trim() || '',
                primary_host_last_name: nextConfig.hosts?.primary?.lastName?.trim() || null,
                primary_host_phone: nextConfig.hosts?.primary?.phone?.trim() || null,
                secondary_host_first_name: nextConfig.hosts?.secondary?.firstName?.trim() || null,
                secondary_host_last_name: nextConfig.hosts?.secondary?.lastName?.trim() || null,
                secondary_host_phone: nextConfig.hosts?.secondary?.phone?.trim() || null,
                event_date: nextConfig.eventDate,
                rsvp_deadline: nextConfig.rsvpDeadline,
                dress_code: nextConfig.dressCode?.label?.trim() || null,
                max_sides: Number(nextConfig.menu?.maxSides ?? 2),
                public_url: nextConfig.publicUrl?.trim() || null,
                whatsapp_template: nextConfig.whatsappTemplate || null,
                rsvp_group_prompt: nextConfig.copy?.rsvp?.groupPrompt?.trim() || null,
                rsvp_whatsapp_intro: nextConfig.copy?.rsvp?.whatsappIntro?.trim() || null,
                calendar_title_template: nextConfig.copy?.sharing?.calendarTitleTemplate?.trim() || null,
                calendar_description_template: nextConfig.copy?.sharing?.calendarDescriptionTemplate?.trim() || null,
                story_badge: nextConfig.copy?.sharing?.storyBadge?.trim() || null,
                story_footer: nextConfig.copy?.sharing?.storyFooter?.trim() || null,
                mentions_section_title: nextConfig.featuredGroups?.sectionTitle?.trim() || null,
                special_mentions_title: nextConfig.specialMentions?.title?.trim() || null,
                group_a_label: nextConfig.featuredGroups?.groupA?.label?.trim() || null,
                group_a_member_1: nextConfig.featuredGroups?.groupA?.member1?.trim() || null,
                group_a_member_2: nextConfig.featuredGroups?.groupA?.member2?.trim() || null,
                group_b_label: nextConfig.featuredGroups?.groupB?.label?.trim() || null,
                group_b_member_1: nextConfig.featuredGroups?.groupB?.member1?.trim() || null,
                group_b_member_2: nextConfig.featuredGroups?.groupB?.member2?.trim() || null,
                hero_badge: nextConfig.copy?.hero?.badge?.trim() || null,
                date_section_title: nextConfig.copy?.dateSection?.title?.trim() || null,
                date_weekday_label: nextConfig.copy?.dateSection?.weekdayLabel?.trim() || null,
                locations_title: nextConfig.copy?.locations?.title?.trim() || null,
                locations_subtitle: nextConfig.copy?.locations?.subtitle?.trim() || null,
                schedule_title: nextConfig.copy?.schedule?.title?.trim() || null,
                rsvp_title: nextConfig.copy?.rsvp?.title?.trim() || null,
                rsvp_subtitle: nextConfig.copy?.rsvp?.subtitle?.trim() || null,
                contributions_title: nextConfig.copy?.contributions?.title?.trim() || null,
                contributions_subtitle: nextConfig.copy?.contributions?.subtitle?.trim() || null,
                closing_quote: nextConfig.copy?.closing?.quote?.trim() || null,
                closing_signature: nextConfig.copy?.closing?.signature?.trim() || null,
                footer_note: nextConfig.copy?.footer?.note?.trim() || null,
                footer_reference: nextConfig.copy?.footer?.reference?.trim() || null,
                welcome_button_label: nextConfig.copy?.welcome?.buttonLabel?.trim() || null,
                updated_at: new Date().toISOString(),
            };

            const { error: cfgErr } = await supabase.from('event_settings').upsert([scalarPayload]);
            if (cfgErr) throw cfgErr;

            await syncRelationalTable(
                'guest_groups',
                (nextConfig.groups || []).map((g, idx) => ({
                    id: g.id,
                    name: g.name.trim(),
                    color: g.color || 'gray',
                    icon_key: g.iconKey || 'Users',
                    contact_phone: g.contactPhone?.trim() || null,
                    sort_order: idx,
                }))
            );

            await syncRelationalTable(
                'menu_main_courses',
                (nextConfig.menu?.mainCourses || []).map((p, idx) => ({
                    id: p.id,
                    name: p.name.trim(),
                    sort_order: idx,
                }))
            );

            await syncRelationalTable(
                'menu_sides',
                (nextConfig.menu?.sides || []).map((s, idx) => ({
                    id: s.id,
                    name: s.name.trim(),
                    sort_order: idx,
                }))
            );

            await syncRelationalTable(
                'event_locations',
                (nextConfig.locations || []).map((loc, idx) => ({
                    id: loc.id || `loc-${idx + 1}`,
                    location_type: loc.locationType || 'main_venue',
                    title: loc.title?.trim() || 'Evento',
                    venue_name: loc.venueName?.trim() || null,
                    address: loc.address?.trim() || null,
                    time_label: loc.timeLabel?.trim() || null,
                    map_url: loc.mapUrl?.trim() || null,
                    external_link: loc.externalLink?.trim() || null,
                    platform: loc.platform?.trim() || null,
                    stream_url: loc.streamUrl?.trim() || null,
                    access_code: loc.accessCode?.trim() || null,
                    sort_order: idx,
                }))
            );

            await syncRelationalTable(
                'schedule_items',
                (nextConfig.schedule || []).map((it, idx) => ({
                    id: it.id || `sch-${idx + 1}`,
                    time_label: it.timeLabel?.trim() || '',
                    title: it.title?.trim() || '',
                    icon_name: it.iconName || 'MapPin',
                    sort_order: idx,
                }))
            );

            await syncRelationalTable(
                'payment_accounts',
                (nextConfig.paymentAccounts || []).map((acc, idx) => ({
                    id: acc.id || `acc-${idx + 1}`,
                    method_type: acc.methodType === 'Binance Pay' ? 'Binance Pay' : 'Pago Móvil',
                    institution: acc.institution?.trim() || '',
                    account_holder: acc.accountHolder?.trim() || '',
                    phone: acc.methodType === 'Binance Pay' ? null : (acc.phone?.trim() || null),
                    document_id: acc.methodType === 'Binance Pay' ? null : (acc.documentId?.trim() || null),
                    external_account_id: acc.methodType === 'Binance Pay' ? (acc.externalAccountId?.trim() || null) : null,
                    sort_order: idx,
                }))
            );

            await syncRelationalTable(
                'special_mentions',
                (nextConfig.specialMentions?.items || []).map((m, idx) => ({
                    id: m.id || `men-${idx + 1}`,
                    name: m.name?.trim() || '',
                    role: m.role?.trim() || 'Mención',
                    sort_order: idx,
                }))
            );

            await loadConfigFromDB();
            return { success: true };
        } catch (err) {
            console.error('[EventConfigContext] Error saving config:', err);
            return { success: false, error: formatDbError(err) };
        }
    };

    if (loading) {
        return (
            <div className="min-h-dvh-safe bg-background flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <EventConfigContext.Provider value={{ config, loading, saveConfig, reloadConfig: loadConfigFromDB }}>
            {children}
        </EventConfigContext.Provider>
    );
};

export const useEventConfig = () => useContext(EventConfigContext);
