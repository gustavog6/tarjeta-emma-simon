/**
 * src/config/eventLimits.js
 * ─────────────────────────────────────────────────────────────
 * Single source of truth for mobile-first visual bounds (360px–430px),
 * aligned with supabase/009_agnostic_event_schema.sql.
 */

export const EVENT_LIMITS = {
    hosts: {
        firstNameMax: 25,
        lastNameMax: 30,
    },
    hero: {
        badgeMax: 30,
        welcomeButtonMax: 28,
    },
    dateSection: {
        titleMax: 30,
        weekdayMax: 20,
    },
    locations: {
        min: 1,
        max: 4,
        titleMax: 40,
        venueMax: 60,
        addressMax: 120,
        timeMax: 25,
        sectionTitleMax: 35,
        sectionSubtitleMax: 160,
    },
    schedule: {
        min: 0,
        max: 8,
        sectionTitleMax: 35,
        timeMax: 15,
        titleMax: 55,
    },
    dressCode: {
        min: 0,
        max: 1,
        labelMax: 40,
    },
    menu: {
        mainCoursesMin: 1,
        mainCoursesMax: 8,
        mainCourseNameMax: 55,
        sidesMin: 0,
        sidesMax: 10,
        sideNameMax: 40,
        maxSidesLimit: 6,
    },
    groups: {
        min: 1,
        max: 6,
        nameMax: 30,
    },
    paymentAccounts: {
        min: 0,
        max: 6,
        institutionMax: 35,
        holderMax: 50,
        fieldMax: 35,
        sectionTitleMax: 35,
        sectionSubtitleMax: 180,
    },
    featuredGroups: {
        sectionTitleMax: 45,
        labelMax: 40,
        memberNameMax: 50,
    },
    specialMentions: {
        min: 0,
        max: 6,
        sectionTitleMax: 45,
        nameMax: 50,
        roleMax: 30,
    },
    gallery: {
        min: 0,
        previewMax: 6,
        totalVisibleMax: 60,
        dbMax: 120,
    },
    closing: {
        quoteMax: 220,
        signatureMax: 60,
    },
    footer: {
        noteMax: 320,
        referenceMax: 50,
    },
    rsvp: {
        titleMax: 35,
        subtitleMax: 180,
        groupPromptMax: 80,
        whatsappIntroMax: 160,
        extraPassesMax: 15,
        firstNameMax: 40,
        lastNameMax: 40,
        phoneMax: 25,
        emailMax: 100,
    },
    sharing: {
        calendarTitleMax: 80,
        calendarDescMax: 200,
        storyBadgeMax: 40,
        storyFooterMax: 90,
    },
};

export const limitList = (arr, max) => (Array.isArray(arr) ? arr.slice(0, max) : []);

export const clampText = (value, max) => {
    if (value == null) return '';
    const str = String(value).trim();
    if (!max || str.length <= max) return str;
    return `${str.slice(0, max - 1).trimEnd()}…`;
};
