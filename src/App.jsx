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

function InvitacionContent({ initialInvitado, autoPlayMusic }) {
    const [invitado, setInvitado] = useState(initialInvitado);

    return (
        <div className="min-h-screen bg-background font-body text-gray-800 selection:bg-primary selection:text-white">
            <MusicPlayer autoPlayOnMount={autoPlayMusic} />
            <Hero />
            <SaveTheDate />
            <EventCards />
            <Timeline />
            <RsvpSection
                invitado={invitado}
                onUpdateInvitado={setInvitado}
            />
            <ParentsSection />
            <Gallery invitado={invitado} />
            <QuoteSection />
            <Acknowledgements />
        </div>
    );
}

function App() {
    const [entered, setEntered] = useState(false);
    const [autoPlayMusic, setAutoPlayMusic] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('admin')) {
            setIsAdmin(true);
        }
    }, []);

    if (isAdmin) {
        return <AdminPanel />;
    }

    return (
        <>
            {!entered && (
                <WelcomeOverlay
                    onEnter={({ soundEnabled }) => {
                        setAutoPlayMusic(soundEnabled);
                        setEntered(true);
                    }}
                />
            )}
            {entered && (
                <AccessGate>
                    {(invitado) => (
                        <InvitacionContent
                            initialInvitado={invitado}
                            autoPlayMusic={autoPlayMusic}
                        />
                    )}
                </AccessGate>
            )}
        </>
    );
}

export default App;
