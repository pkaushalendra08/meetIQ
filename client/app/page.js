"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react"; 

export default function Home() {
  const [username, setUsername] = useState("");
  const router = useRouter();

  const handleJoin = () => {
    const name = username.trim() === "" ? "Guest" : username.trim();
    const meetingId = process.env.NEXT_PUBLIC_CALL_ID;
    router.push(`/meeting/${meetingId}?name=${encodeURIComponent(name)}`);
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-gray-950 text-white selection:bg-blue-500 selection:text-white">
      
      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="absolute bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-cyan-500/10 blur-[100px]" />
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="group relative bg-gray-900/60 backdrop-blur-xl border border-gray-800/60 rounded-3xl p-8 shadow-2xl ring-1 ring-white/10">
          
          <div className="text-center mb-10 space-y-3">
            <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-2">
              <Sparkles className="w-3 h-3 text-blue-400 animate-pulse" />
              <span className="text-xs font-medium text-blue-300 tracking-wide uppercase">
                AI Powered
              </span>
            </div>
            
            <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-linear-to-br from-white via-blue-100 to-blue-400">
              MeetIQ
            </h1>
            <p className="text-gray-400 text-lg font-medium">
              Your Smart Meeting Assistant
            </p>
          </div>

          {/* Input Section */}
          <div className="space-y-6">
            
        
            <div className="flex flex-col gap-5">
              <label htmlFor="username" className="text-sm font-medium text-gray-300 ml-1">
                Display Name
              </label>
              
              <div className="relative group/input">
                <Input
                  id="username"
                  placeholder="e.g. Kaushal (Optional)"
                  className="px-5 py-6 w-full bg-gray-950/50 border-gray-700/50 text-gray-100 placeholder:text-gray-600 rounded-xl focus:border-blue-500/50 focus:ring-blue-500/20 focus:bg-gray-900/80 transition-all duration-300"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                />
                <div className="absolute inset-0 rounded-xl ring-1 ring-white/5 pointer-events-none group-hover/input:ring-white/10 transition-all" />
              </div>
            </div>

            <Button
              onClick={handleJoin}
              className="w-full py-6 text-lg bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300 group/btn"
            >
              <span className="mr-2">Join Meeting</span>
              <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Footer Text */}
          <p className="mt-8 text-center text-xs text-gray-500">
            Powered by Stream & Gemini AI
          </p>
        </div>
      </div>
    </div>
  );
}