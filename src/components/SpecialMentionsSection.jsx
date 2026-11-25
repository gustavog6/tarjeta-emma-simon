import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';
import { useEventConfig } from '../context/EventConfigContext';
import { EVENT_LIMITS, limitList, clampText } from '../config/eventLimits';

const SpecialMentionsSection = () => {
    const { config } = useEventConfig();
    const { featuredGroups, specialMentions, hosts } = config;
    const mentionItems = limitList(specialMentions?.items, EVENT_LIMITS.specialMentions.max);

    const groupA = featuredGroups?.groupA || {};
    const groupB = featuredGroups?.groupB || {};

    const hasGroupA = Boolean(groupA.member1?.trim() || groupA.member2?.trim());
    const hasGroupB = Boolean(groupB.member1?.trim() || groupB.member2?.trim());
    const hasFeaturedGroups = hasGroupA || hasGroupB;
    const hasSpecialMentions = mentionItems.length > 0;

    if (!hasFeaturedGroups && !hasSpecialMentions) return null;

    const sectionTitle = clampText(
        featuredGroups?.sectionTitle || 'Menciones Especiales',
        EVENT_LIMITS.featuredGroups.sectionTitleMax
    );
    const specialTitle = clampText(
        specialMentions?.title || 'Invitados de Honor',
        EVENT_LIMITS.specialMentions.sectionTitleMax
    );

    const secondaryHostName = hosts?.secondary?.firstName?.trim() || '';
    const primaryHostName = hosts?.primary?.firstName?.trim() || '';

    const subtitleBar =
        hasFeaturedGroups && hasSpecialMentions
            ? `${groupA.label || groupB.label || 'Destacados'} · ${specialTitle}`
            : hasFeaturedGroups
                ? groupA.label || groupB.label || 'Destacados'
                : specialTitle;

    return (
        <section className="py-20 px-4 bg-secondary/10 relative overflow-hidden">
            {/* Decorative SVG lines matching Timeline */}
            <div className="absolute top-0 left-0 w-32 md:w-44 opacity-30 pointer-events-none">
                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary w-full h-full transform -scale-x-100">
                    <path d="M20 20C20 20 60 20 80 50C100 80 80 120 50 120C20 120 20 80 50 80C80 80 120 120 120 160C120 200 160 200 160 200" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </div>
            <div className="absolute bottom-0 right-0 w-32 md:w-44 opacity-30 pointer-events-none">
                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary w-full h-full">
                    <path d="M20 20C20 20 60 20 80 50C100 80 80 120 50 120C20 120 20 80 50 80C80 80 120 120 120 160C120 200 160 200 160 200" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </div>

            <div className="max-w-5xl mx-auto relative z-10 min-w-0">
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <h2 className="font-heading section-title-fluid text-primary mb-4 break-anywhere">
                        {sectionTitle}
                    </h2>
                    <div className="flex items-center justify-center gap-4">
                        <div className="h-[1px] w-12 bg-primary/30 shrink-0" />
                        <span className="font-body text-gray-500 tracking-[0.3em] uppercase text-xs break-anywhere">
                            {subtitleBar}
                        </span>
                        <div className="h-[1px] w-12 bg-primary/30 shrink-0" />
                    </div>
                </motion.div>

                {hasFeaturedGroups && (
                    <div className={`grid gap-8 mb-8 ${hasGroupA && hasGroupB ? 'md:grid-cols-2' : 'max-w-lg mx-auto'}`}>
                        {hasGroupA && (
                            <motion.div
                                className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-primary text-center flex flex-col items-center group min-w-0"
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                whileHover={{ y: -5 }}
                            >
                                <div className="bg-primary/10 w-14 h-14 rounded-full flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                                    <Heart size={26} />
                                </div>
                                {groupA.label && (
                                    <p className="text-[11px] uppercase tracking-[0.3em] text-gray-400 font-semibold mb-1 break-anywhere">
                                        {clampText(groupA.label, EVENT_LIMITS.featuredGroups.labelMax)}
                                    </p>
                                )}
                                {secondaryHostName && (
                                    <h3 className="font-heading text-3xl text-primary mb-4 break-anywhere">
                                        {secondaryHostName}
                                    </h3>
                                )}
                                <div className="h-px w-12 bg-primary/20 mb-4" />
                                <div className="space-y-1 text-gray-700 min-w-0">
                                    {groupA.member1 && (
                                        <p className="text-lg font-medium tracking-wide break-anywhere">
                                            {clampText(groupA.member1, EVENT_LIMITS.featuredGroups.memberNameMax)}
                                        </p>
                                    )}
                                    {groupA.member1 && groupA.member2 && (
                                        <p className="font-heading text-2xl text-primary leading-none py-0.5">&amp;</p>
                                    )}
                                    {groupA.member2 && (
                                        <p className="text-lg font-medium tracking-wide break-anywhere">
                                            {clampText(groupA.member2, EVENT_LIMITS.featuredGroups.memberNameMax)}
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {hasGroupB && (
                            <motion.div
                                className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-primary text-center flex flex-col items-center group min-w-0"
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.15 }}
                                whileHover={{ y: -5 }}
                            >
                                <div className="bg-primary/10 w-14 h-14 rounded-full flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                                    <Heart size={26} />
                                </div>
                                {groupB.label && (
                                    <p className="text-[11px] uppercase tracking-[0.3em] text-gray-400 font-semibold mb-1 break-anywhere">
                                        {clampText(groupB.label, EVENT_LIMITS.featuredGroups.labelMax)}
                                    </p>
                                )}
                                {primaryHostName && (
                                    <h3 className="font-heading text-3xl text-primary mb-4 break-anywhere">
                                        {primaryHostName}
                                    </h3>
                                )}
                                <div className="h-px w-12 bg-primary/20 mb-4" />
                                <div className="space-y-1 text-gray-700 min-w-0">
                                    {groupB.member1 && (
                                        <p className="text-lg font-medium tracking-wide break-anywhere">
                                            {clampText(groupB.member1, EVENT_LIMITS.featuredGroups.memberNameMax)}
                                        </p>
                                    )}
                                    {groupB.member1 && groupB.member2 && (
                                        <p className="font-heading text-2xl text-primary leading-none py-0.5">&amp;</p>
                                    )}
                                    {groupB.member2 && (
                                        <p className="text-lg font-medium tracking-wide break-anywhere">
                                            {clampText(groupB.member2, EVENT_LIMITS.featuredGroups.memberNameMax)}
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}

                {hasSpecialMentions && (
                    <motion.div
                        className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-primary text-center max-w-3xl mx-auto group min-w-0"
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.25 }}
                        whileHover={{ y: -5 }}
                    >
                        <div className="bg-primary/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-primary group-hover:scale-110 transition-transform">
                            <Sparkles size={26} />
                        </div>
                        <h3 className="font-heading text-4xl text-primary mb-2 break-anywhere">{specialTitle}</h3>
                        <div className="h-px w-14 bg-primary/20 mx-auto mb-6" />

                        <div className={`grid gap-6 ${mentionItems.length === 1 ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
                            {mentionItems.map((m, i) => (
                                <div key={m.id || i} className="space-y-1 min-w-0">
                                    <p className="text-[11px] uppercase tracking-[0.28em] text-primary/80 font-semibold break-anywhere">
                                        {clampText(m.role, EVENT_LIMITS.specialMentions.roleMax)}
                                    </p>
                                    <p className="text-lg font-medium text-gray-700 tracking-wide break-anywhere">
                                        {clampText(m.name, EVENT_LIMITS.specialMentions.nameMax)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </section>
    );
};

export default SpecialMentionsSection;
