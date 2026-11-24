import React, { useState, useEffect } from 'react';
import AccessGate from './components/AccessGate';
import WelcomeOverlay from './components/WelcomeOverlay';
import MusicPlayer from './components/MusicPlayer';
import Hero from './components/Hero';
import SaveTheDate from './components/SaveTheDate';
import EventCards from './components/EventCards';
import Timeline from './components/Timeline';
import RsvpSection from './components/RsvpSection';
import ParentsSection from './components/ParentsSection';
import Gallery from './components/Gallery';
import QuoteSection from './components/QuoteSection';
import Acknowledgements from './components/Acknowledgements';
import AdminPanel from './components/AdminPanel';
import AdminLogin from './components/AdminLogin';
import { supabase } from './lib/supabase';

function InvitacionContent({ invitado, confirmaciones, onReload }) {
    const [entered, setEntered] = useState(false);
    const [autoPlayMusic, setAutoPlayMusic] = useState(true);

    if (!entered) {
        return (
            <WelcomeOverlay
                onEnter={({ soundEnabled }) => {
                    setAutoPlayMusic(soundEnabled);
                    setEntered(true);
                }}
            />
        );
    }

    return (
        <div className="min-h-screen bg-background font-body text-gray-800 selection:bg-primary selection:text-white">
            <MusicPlayer autoPlayOnMount={autoPlayMusic} />
            <Hero />
            <SaveTheDate />
            <EventCards />
            <Timeline />
            <RsvpSection
                invitado={invitado}
                confirmaciones={confirmaciones}
                onReload={onReload}
            />
            <ParentsSection />
            <Gallery invitado={invitado} />
            <QuoteSection />
            <Acknowledgements />
        </div>
    );
}

function AdminGate() {
    const [session, setSession] = useState(undefined); // undefined = cargando

    useEffect(() => {
        let mounted = true;
        supabase.auth.getSession().then(({ data }) => {
            if (mounted) setSession(data?.session ?? null);
        });

        const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
            if (mounted) setSession(nextSession ?? null);
        });

        return () => {
            mounted = false;
            listener?.subscription?.unsubscribe();
        };
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setSession(null);
    };

    if (session === undefined) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!session) {
        return <AdminLogin onLoginSuccess={(s) => setSession(s)} />;
    }

    return <AdminPanel user={session.user} onLogout={handleLogout} />;
}

function App() {
    const [isAdmin, setIsAdmin] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.has('admin');
    });

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setIsAdmin(params.has('admin'));
    }, []);

    if (isAdmin) {
        return <AdminGate />;
    }

    return (
        <AccessGate>
            {(invitado, confirmaciones, reload) => (
                <InvitacionContent
                    invitado={invitado}
                    confirmaciones={confirmaciones}
                    onReload={reload}
                />
            )}
        </AccessGate>
    );
}

export default App;
