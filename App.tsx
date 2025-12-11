import React, { useState, useEffect } from 'react';
import { NurseDashboard } from './components/NurseDashboard';
import { PatientHUD } from './components/PatientHUD';
import { Visitor, AppMode } from './types';

export default function App() {
  const [mode, setMode] = useState<AppMode>(AppMode.DASHBOARD);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  // Load data from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('memory_lens_visitors');
    if (saved) {
      try {
        setVisitors(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved visitors");
      }
    }

    // Check environment (in a real app, you'd check a secure context or prompt)
    if (process.env.API_KEY) {
      setHasApiKey(true);
    }
  }, []);

  // Save data whenever it changes
  const updateVisitors = (newVisitors: Visitor[]) => {
    setVisitors(newVisitors);
    localStorage.setItem('memory_lens_visitors', JSON.stringify(newVisitors));
  };

  if (!hasApiKey) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white p-4">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold mb-4 text-red-500">Configuration Error</h1>
          <p className="mb-4 text-gray-300">
            API Key is missing. This application requires a Google Gemini API Key to function. 
            The environment variable <code>process.env.API_KEY</code> must be set.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {mode === AppMode.DASHBOARD ? (
        <NurseDashboard 
          visitors={visitors} 
          onUpdateVisitors={updateVisitors} 
          onSwitchMode={() => setMode(AppMode.HUD)} 
        />
      ) : (
        <PatientHUD 
          visitors={visitors} 
          onExit={() => setMode(AppMode.DASHBOARD)} 
        />
      )}
    </div>
  );
}