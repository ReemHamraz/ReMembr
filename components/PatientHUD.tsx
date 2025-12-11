import React, { useEffect, useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Visitor, DetectedPerson, RecognitionResult } from '../types';
import { identifyVisitor } from '../services/geminiService';
import { ArrowLeft, Loader2, Battery, Wifi, Eye, Volume2, ShieldAlert, AlertCircle, CloudOff } from 'lucide-react';

interface PatientHUDProps {
  visitors: Visitor[];
  onExit: () => void;
}

export const PatientHUD: React.FC<PatientHUDProps> = ({ visitors, onExit }) => {
  const webcamRef = useRef<Webcam>(null);
  const [trackedPeople, setTrackedPeople] = useState<DetectedPerson[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [spokenIds, setSpokenIds] = useState<Set<string>>(new Set());
  const [rateLimited, setRateLimited] = useState(false);

  // --- Soft Language Generator ---
  const getSoftText = (person: DetectedPerson) => {
    if (person.confidenceIsLow) {
      return "I'm having trouble seeing clearly.";
    }
    
    if (person.matchFound) {
      if (person.type === 'blocked') {
        return "Caution: This person is restricted.";
      }
      return `Looks like this might be ${person.name}.`;
    }

    return "Someone I can't identify entered the room.";
  };

  // Text to Speech
  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05; 
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const captureAndIdentify = useCallback(async () => {
    if (!webcamRef.current) return;
    
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setIsScanning(true);
    setRateLimited(false);
    
    try {
      // Race against a timeout to prevent app hanging
      const detectionPromise = identifyVisitor(imageSrc, visitors);
      const timeoutPromise = new Promise<RecognitionResult>((_, reject) => 
        setTimeout(() => reject(new Error("Analysis timeout")), 8000)
      );

      const result = await Promise.race([detectionPromise, timeoutPromise]);
      
      setTrackedPeople(result.people || []);

      // Announce
      result.people.forEach(p => {
        const key = p.matchFound && p.visitorId ? p.visitorId : 'unknown_person';
        if (!spokenIds.has(key)) {
          if (p.matchFound) {
             const phrase = p.type === 'blocked' 
               ? "Warning. Restricted visitor detected." 
               : `Hello ${p.name}. It's good to see you.`;
             speak(phrase);
             setSpokenIds(prev => { const s = new Set(prev); s.add(key); return s; });
          }
        }
      });

    } catch (err: any) {
      if (err.message === "QUOTA_EXCEEDED") {
        setRateLimited(true);
        console.warn("Rate limit hit, backing off...");
        // Throwing here to be caught by the loop handler for backoff
        throw err;
      }
      console.warn("Frame analysis skipped:", err);
    } finally {
      setIsScanning(false);
    }
  }, [visitors, spokenIds]);

  // Recursive loop with dynamic delay
  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const loop = async () => {
      if (!isMounted) return;

      try {
        await captureAndIdentify();
        // If successful, wait 3 seconds before next scan (approx 20 RPM, safe for most tiers)
        timeoutId = setTimeout(loop, 3000);
      } catch (error: any) {
        if (error.message === "QUOTA_EXCEEDED") {
          // If rate limited, wait 10 seconds before retrying
          timeoutId = setTimeout(loop, 10000);
        } else {
          // General error, wait standard time
          timeoutId = setTimeout(loop, 3000);
        }
      }
    };

    // Initial start
    timeoutId = setTimeout(loop, 1000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [captureAndIdentify]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden font-sans select-none text-white">
      {/* Feed */}
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        videoConstraints={{ facingMode: "environment" }}
        className="absolute inset-0 w-full h-full object-cover opacity-90"
      />

      {/* Aesthetic Overlay (Vignette) */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/60 pointer-events-none"></div>

      {/* Top HUD Bar */}
      <div className="absolute top-0 w-full p-6 flex justify-between items-start z-20">
         <div className="flex items-center gap-4">
             <button 
                onClick={onExit}
                className="bg-black/30 backdrop-blur-md border border-white/20 p-3 rounded-full hover:bg-black/50 transition-colors"
             >
                <ArrowLeft size={20} className="text-white" />
             </button>
             <div>
                <h1 className="text-lg font-bold tracking-tight text-white/90">ReMembr</h1>
                <div className="flex items-center gap-2">
                   {rateLimited ? (
                     <>
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                      <span className="text-[10px] uppercase tracking-widest text-amber-500 font-bold">Signal Weak (Backing Off)</span>
                     </>
                   ) : (
                     <>
                      <div className={`w-1.5 h-1.5 rounded-full ${isScanning ? 'bg-blue-400 animate-pulse' : 'bg-green-400'}`}></div>
                      <span className="text-[10px] uppercase tracking-widest text-white/60">
                        {isScanning ? 'Analyzing Scene...' : 'Monitoring'}
                      </span>
                     </>
                   )}
                </div>
             </div>
         </div>
         <div className="flex gap-4 text-white/70">
            {rateLimited && <CloudOff size={18} className="text-amber-500" />}
            <Wifi size={18} />
            <Battery size={18} />
         </div>
      </div>

      {/* Tracking Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
         {trackedPeople.map((person, idx) => {
            const [ymin, xmin, ymax, xmax] = person.box_2d;
            const top = ymin / 10;
            const left = xmin / 10;
            const height = (ymax - ymin) / 10;
            const width = (xmax - xmin) / 10;

            let borderColor = 'border-white/50';
            let bgColor = 'bg-white/10';
            let textColor = 'text-white';
            
            if (person.matchFound) {
              if (person.type === 'blocked') {
                borderColor = 'border-amber-500';
                bgColor = 'bg-amber-500/10';
                textColor = 'text-amber-400';
              } else {
                borderColor = 'border-emerald-400';
                bgColor = 'bg-emerald-400/10';
                textColor = 'text-emerald-300';
              }
            }

            return (
              <div 
                key={idx}
                className={`absolute transition-all duration-500 ease-out flex flex-col`}
                style={{ top: `${top}%`, left: `${left}%`, width: `${width}%`, height: `${height}%` }}
              >
                <div className={`w-full h-full border-2 rounded-xl backdrop-blur-[2px] ${borderColor} ${bgColor} relative`}>
                    <div className="absolute -bottom-2 translate-y-full left-1/2 -translate-x-1/2 w-[120%] min-w-[200px] mt-4">
                       <div className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl p-4 flex flex-col gap-2">
                          <div className="flex items-start gap-3 border-b border-white/10 pb-2">
                             <div className={`p-1.5 rounded-full ${person.matchFound && person.type === 'blocked' ? 'bg-amber-500/20' : 'bg-white/10'}`}>
                                {person.matchFound && person.type === 'blocked' ? <ShieldAlert size={16} className="text-amber-500" /> : <Eye size={16} className="text-white/70" />}
                             </div>
                             <div>
                               <p className="text-sm font-medium text-white leading-tight">
                                 {getSoftText(person)}
                               </p>
                               {person.matchFound && (
                                 <span className={`text-[10px] font-bold uppercase tracking-wider ${textColor}`}>
                                   {person.relationship}
                                 </span>
                               )}
                             </div>
                          </div>

                          {person.matchFound && (
                             <div className="space-y-2 pt-1">
                                <div className="flex flex-col">
                                   <span className="text-[10px] text-white/40 uppercase font-semibold">Last Visit</span>
                                   <span className="text-xs text-white/80 leading-snug">{person.lastInteraction}</span>
                                </div>
                                {person.notes && (
                                  <div className="bg-white/5 rounded p-2 text-xs text-white/60 italic">
                                    "{person.notes}"
                                  </div>
                                )}
                             </div>
                          )}

                       </div>
                       <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-black/70"></div>
                    </div>
                </div>
              </div>
            );
         })}
      </div>
    </div>
  );
};