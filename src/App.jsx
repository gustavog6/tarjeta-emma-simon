import React from 'react';
import Hero from './components/Hero';
import SaveTheDate from './components/SaveTheDate';
import Countdown from './components/Countdown';
import EventCards from './components/EventCards';
import ParentsGodparents from './components/ParentsGodparents';
import Gallery from './components/Gallery';
import PartyInfo from './components/PartyInfo';
import Timeline from './components/Timeline';
import QuoteSection from './components/QuoteSection';
import Acknowledgements from './components/Acknowledgements';

function App() {
  return (
    <div className="min-h-screen bg-background font-body text-gray-800 selection:bg-primary selection:text-white">
      <Hero />
      <SaveTheDate />
      <Countdown />
      <EventCards />
      {/* <ParentsGodparents /> */}
      {/* <Gallery /> */}
      <Timeline />
      <PartyInfo />
      <QuoteSection />
      <Acknowledgements />
    </div>
  );
}

export default App;
