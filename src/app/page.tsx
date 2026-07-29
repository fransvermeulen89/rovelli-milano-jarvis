"use client";
import React, { useState, useEffect, useRef } from 'react';

export default function JarvisDashboard() {
  const [time, setTime] = useState("");
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [chatLog, setChatLog] = useState([
    { role: 'jarvis', text: 'TACTICAL CORE ONLINE. ALL PROTOCOLS SECURE FOR ROVELLI MILANO.' },
    { role: 'jarvis', text: 'READY FOR COMMAND, FRANS & SERGIO.' }
  ]);
  
  const chatEndRef = useRef<any>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('nl-NL', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog]);

  const playAudio = (base64: string) => {
    try {
      const audio = new Audio(`data:audio/mp3;base64,${base64}`);
      audio.play().catch(err => console.log("Audio play error:", err));
    } catch (e) {
      console.log("Audio creation error:", e);
    }
  };

  const handleCommandSubmit = async (cmdText: string) => {
    if (!cmdText.trim()) return;

    setChatLog(prev => [...prev, { role: 'frans', text: cmdText }]);
    setInput("");

    try {
      const res = await fetch('/api/jarvis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmdText }),
      });
      const data = await res.json();
      
      setChatLog(prev => [...prev, { role: 'jarvis', text: data.reply }]);
      if (data.audio) {
        playAudio(data.audio);
      }
    } catch (error) {
      setChatLog(prev => [...prev, { role: 'jarvis', text: 'COMMUNICATION ERROR WITH BACKEND CORE.' }]);
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Spraakherkenning vereist Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      setIsListening(false);
      handleCommandSubmit(event.results[0][0].transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const handleFormSubmit = (e: any) => {
    e.preventDefault();
    handleCommandSubmit(input);
  };

  const handleBriefMe = () => {
    handleCommandSubmit("BRIEF ME");
  };

  return (
    <main className="min-h-screen bg-[#02060d] text-[#00f5ff] font-mono p-6 flex flex-col relative overflow-hidden h-screen">
      <header className="flex justify-between items-start z-10">
        <div className="border border-[#00f5ff]/40 bg-[#00f5ff]/5 p-4 relative backdrop-blur-sm shadow-[0_0_15px_rgba(0,245,255,0.1)]">
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#00f5ff]"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#00f5ff]"></div>
          <h1 className="text-3xl font-bold tracking-[0.3em] mb-1">J.A.R.V.I.S.</h1>
          <p className="text-[10px] tracking-[0.2em] text-[#00f5ff]/70">ROVELLI MILANO CORE // HD AUDIO ACTIVE</p>
        </div>

        <div className="border border-[#00f5ff]/40 bg-[#00f5ff]/5 p-4 relative backdrop-blur-sm text-right">
           <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#00f5ff]"></div>
           <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[#00f5ff]"></div>
           <div className="text-2xl font-bold tracking-widest">{time || "00:00:00"}</div>
           <div className="text-[10px] tracking-[0.1em] text-[#00f5ff]/70 mt-1 flex items-center justify-end gap-2">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_5px_#22c55e]"></div>
             SECURE CHANNELS ACTIVE
           </div>
        </div>
      </header>

      <div className="flex justify-between items-start z-10 mt-6 h-[40vh]">
        <div className="w-[300px] border border-[#00f5ff]/40 bg-[#00f5ff]/5 p-6 relative backdrop-blur-sm">
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#00f5ff]"></div>
          <h2 className="text-sm font-bold tracking-[0.2em] mb-4 border-b border-[#00f5ff]/20 pb-2">CHANNELS & FLOWS</h2>
          <div className="space-y-3 text-xs tracking-wider text-[#00f5ff]/80">
            <p className="flex justify-between">Shopify Store <span>[<span className="text-green-400">SYNCED</span>]</span></p>
            <p className="flex justify-between">Meta Ads Manager <span>[<span className="text-green-400">SYNCED</span>]</span></p>
            <p className="flex justify-between">Klaviyo (Italië) <span>[<span className="text-green-400">SYNCED</span>]</span></p>
            <p className="flex justify-between">OpenAI HD Voice <span>[<span className="text-green-400">SYNCED</span>]</span></p>
          </div>
        </div>

        <div className="relative w-[300px] h-[300px] flex items-center justify-center">
          <div className="absolute w-full h-full rounded-full border border-[#00f5ff]/20" style={{ animation: 'spin3D 10s linear infinite' }}></div>
          <div className="absolute w-[80%] h-[80%] rounded-full border border-[#00f5ff]/10" style={{ transform: 'rotateX(60deg)', animation: 'spin3D 15s linear infinite reverse' }}></div>
          <div className={`w-12 h-12 rounded-full bg-[#00f5ff]/20 shadow-[0_0_50px_#00f5ff] blur-md ${isListening ? 'animate-ping bg-red-500 shadow-[0_0_50px_red]' : ''}`}></div>
          <div className="absolute w-3 h-3 rounded-full bg-[#00f5ff] shadow-[0_0_20px_#00f5ff]"></div>
        </div>

        <div className="w-[300px] border border-[#00f5ff]/40 bg-[#00f5ff]/5 p-6 relative backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#00f5ff]"></div>
          <h2 className="text-sm font-bold tracking-[0.2em] mb-4 border-b border-[#00f5ff]/20 pb-2">APPROVAL STATUS</h2>
          <div className="space-y-4 text-xs tracking-wider">
            <div className="p-2 border border-yellow-500/40 bg-yellow-500/10 text-yellow-300">
              PENDING: DUALE AUTORISATIE VEREIST VAN FRANS & SERGIO VOOR LANCERING.
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 mt-4 mb-4 border border-[#00f5ff]/20 bg-[#00f5ff]/5 p-4 overflow-y-auto z-10 backdrop-blur-sm">
        {chatLog.map((msg, index) => (
          <div key={index} className={`mb-3 text-sm tracking-wide flex ${msg.role === 'frans' ? 'text-white' : 'text-[#00f5ff]'}`}>
            <span className="w-24 shrink-0 font-bold opacity-50">
              {msg.role === 'frans' ? 'COMMAND:' : 'JARVIS:'}
            </span>
            <span className="uppercase">{msg.text}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <footer className="mt-auto flex justify-between items-center z-10 relative">
        <form onSubmit={handleFormSubmit} className="w-full flex gap-4">
          <div className="flex-1 border border-[#00f5ff]/40 bg-[#00f5ff]/10 relative backdrop-blur-sm flex items-center px-4">
            <span className="text-[#00f5ff] font-bold mr-3">&gt;</span>
            <input 
              type="text" 
              value={input}
              onChange={(e: any) => setInput(e.target.value)}
              placeholder={isListening ? "LISTENING TO COMMAND..." : "SPEAK OR ENTER COMMAND (YES / APPROVE)..."}
              className="w-full bg-transparent text-[#00f5ff] outline-none placeholder-[#00f5ff]/30 py-4 uppercase tracking-widest text-sm"
              autoFocus
            />
          </div>

          <button 
            type="button"
            onClick={startListening}
            className={`border px-6 py-4 text-sm font-bold tracking-[0.2em] transition-all uppercase cursor-pointer flex items-center gap-2 ${isListening ? 'border-red-500 bg-red-500/20 text-red-400 animate-pulse' : 'border-[#00f5ff]/80 bg-[#00f5ff]/10 text-[#00f5ff] hover:bg-[#00f5ff]/30'}`}
          >
            {isListening ? 'Listening...' : '🎤 Speak'}
          </button>
          
          <button 
            type="submit"
            className="border border-[#00f5ff]/80 bg-[#00f5ff]/10 px-8 py-4 text-sm font-bold tracking-[0.2em] text-[#00f5ff] hover:bg-[#00f5ff]/30 transition-all uppercase cursor-pointer"
          >
            Execute
          </button>

          <button 
            type="button"
            onClick={handleBriefMe}
            className="border border-[#00f5ff]/80 bg-white/10 px-8 py-4 text-sm font-bold tracking-[0.2em] text-white hover:bg-white/30 transition-all uppercase cursor-pointer"
          >
            Brief Me
          </button>
        </form>
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin3D {
          0% { transform: rotateY(0deg) rotateX(20deg); }
          100% { transform: rotateY(360deg) rotateX(20deg); }
        }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: rgba(0,245,255,0.05); }
        ::-webkit-scrollbar-thumb { background: rgba(0,245,255,0.2); border-radius: 4px; }
      `}} />
    </main>
  );
}