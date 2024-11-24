import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SpeechPage from './pages/SpeechPage';
import Navbar from './components/Navbar';

const App = () => {
  return (
   <>
    <Navbar/>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/SpeechPage" element={<SpeechPage />} />
    </Routes>
   </>
  );
};

export default App;
