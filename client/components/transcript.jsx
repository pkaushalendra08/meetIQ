"use client";

import { useEffect, useState, useRef } from "react";
import { useCall } from "@stream-io/video-react-sdk";
import { useChatContext } from "stream-chat-react";

export function TranscriptPanel() {
  const { client } = useChatContext();
  const [transcripts, setTranscripts] = useState([]);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const transcriptEndRef = useRef(null);
  const call = useCall();

  
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts, isBotThinking]);

  useEffect(() => {
    if (!call) return;

    const callId = process.env.NEXT_PUBLIC_CALL_ID;
    const channel = client.channel("messaging", callId);
    channel.watch();

    
    const handleClosedCaption = (event) => {
      if (event.closed_caption) {
        // Ignore bot's speech in captions (we show the full chat message instead)
        if (event.closed_caption.user?.id === "meeting-assistant-bot" || event.closed_caption.user?.name === "Meeting Assistant") {
            return;
        }
        
        const text = event.closed_caption.text;
        
        const newTranscript = {
          text: text,
          speaker: event.closed_caption.user?.name || "Unknown",
          timestamp: new Date(event.closed_caption.start_time).toLocaleTimeString(),
          isBot: false
        };
        setTranscripts((prev) => [...prev, newTranscript]);

        
        if (text.toLowerCase().includes("hey assistant")) {
             setIsBotThinking(true);
             
            
             setTimeout(() => setIsBotThinking(false), 15000);
        }
      }
    };

   
    const handleNewMessage = (event) => {
      const message = event.message;
      
      
      if (message?.user?.id === "meeting-assistant-bot") {
        setIsBotThinking(false);
        
        const botReply = {
          text: message.text,
          speaker: "Meeting Assistant",
          timestamp: new Date().toLocaleTimeString(),
          isBot: true 
        };
        setTranscripts((prev) => [...prev, botReply]);
      }
    };

    call.on("call.closed_caption", handleClosedCaption);
    channel.on("message.new", handleNewMessage);

    return () => {
      call.off("call.closed_caption", handleClosedCaption);
      channel.off("message.new", handleNewMessage);
    };
  }, [call]);

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white rounded-xl overflow-hidden shadow-inner border border-gray-800">
      
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-gray-700 bg-linear-to-r from-gray-800 to-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Live Transcript</h3>
              <p className="text-xs text-gray-400">
                {transcripts.length} {transcripts.length === 1 ? "message" : "messages"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 bg-green-500/10 rounded-full border border-green-500/20">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] uppercase tracking-wider text-green-400 font-bold">Live</span>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-gray-900/50 custom-scrollbar">
        {transcripts.length === 0 && !isBotThinking ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 opacity-50">
             <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mb-3">
               <span className="text-2xl">🎙️</span>
             </div>
             <p className="text-sm font-medium text-gray-300">Waiting for speech...</p>
          </div>
        ) : (
          <>
            {transcripts.map((transcript, idx) => (
              <div
                key={idx}
                className={`group relative rounded-lg p-3 border transition-all ${
                  transcript.isBot 
                    ? "bg-blue-900/20 border-blue-500/30" 
                    : "bg-linear-to-br from-gray-800 to-gray-800/50 border-gray-700/50 hover:border-gray-600"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md ${
                      transcript.isBot 
                        ? "bg-blue-500" 
                        : "bg-linear-to-br from-blue-600 to-blue-700"
                    }`}
                  >
                    {transcript.isBot ? "AI" : transcript.speaker.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold truncate ${transcript.isBot ? "text-blue-200" : "text-blue-300"}`}>
                        {transcript.speaker}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {transcript.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-gray-200 leading-relaxed wrap-break-word">
                      {transcript.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            
            {isBotThinking && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-900/10 border border-blue-500/20 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                   <div className="flex gap-1">
                     <div className="w-1 h-1 bg-white rounded-full animate-bounce delay-75"></div>
                     <div className="w-1 h-1 bg-white rounded-full animate-bounce delay-150"></div>
                     <div className="w-1 h-1 bg-white rounded-full animate-bounce delay-300"></div>
                   </div>
                </div>
                <div className="text-sm text-blue-200 font-medium">
                  Meeting Assistant is thinking...
                </div>
              </div>
            )}
            
            <div ref={transcriptEndRef} className="h-1" />
          </>
        )}
      </div>
    </div>
  );
}