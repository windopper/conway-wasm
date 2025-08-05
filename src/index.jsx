import React from 'react';
import { createRoot } from 'react-dom/client';
import GameOfLife from './App';
import { DarkModeProvider } from './DarkModeContext';
import './style.css';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <DarkModeProvider>
    <GameOfLife />
  </DarkModeProvider>
); 