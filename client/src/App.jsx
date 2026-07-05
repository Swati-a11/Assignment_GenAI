import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import LandingPage from './components/LandingPage';
import ChatPage from './components/ChatPage';

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/chat/:mentorId" element={<ChatPage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </AnimatePresence>
  );
}
