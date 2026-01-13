import React from 'react';
import Hero from './components/Hero';
import Countdown from './components/Countdown';
import EventCards from './components/EventCards';
import ParentsGodparents from './components/ParentsGodparents';
import Gallery from './components/Gallery';
import PartyInfo from './components/PartyInfo';
import Timeline from './components/Timeline';
import Acknowledgements from './components/Acknowledgements';

function App() {
  return (
    <div className="min-h-screen bg-background font-body text-gray-800 selection:bg-primary selection:text-white">
      <Hero />
      <Countdown />
      <EventCards />
      <ParentsGodparents />
      <Gallery />
      <Timeline />
      <PartyInfo />
      <Acknowledgements />
    </div>
  );
}

export default App;
