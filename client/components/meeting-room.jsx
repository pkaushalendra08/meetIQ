"use client";

import { useEffect, useState, useRef } from "react";
import {
  StreamCall,
  useStreamVideoClient,
  PaginatedGridLayout, // <--- CHANGED: Using Grid Layout instead of SpeakerLayout
  CallControls,
  StreamTheme,
  SpeakerLayout, // Keeping this import if you want to toggle later
} from "@stream-io/video-react-sdk";

import { TranscriptPanel } from "@/components/transcript";
import "@stream-io/video-react-sdk/dist/css/styles.css";

export default function MeetingRoom({ callId, onLeave, userId }) {
  const client = useStreamVideoClient();
  const [call, setCall] = useState(null);
  const [error, setError] = useState(null);

  const joinedRef = useRef(false);
  const leavingRef = useRef(false);
  const callType = "default";

  useEffect(() => {
    if (!client) return;
    if (joinedRef.current) return;

    joinedRef.current = true;

    const init = async () => {
      try {
        const myCall = client.call(callType, callId);

        await myCall.getOrCreate({
          data: {
            created_by_id: userId,
            members: [{ user_id: userId, role: "call_member" }],
          },
        });
        await myCall.join();
        await myCall.startClosedCaptions({ language: "en" });

        myCall.on("call.session_ended", () => {
          onLeave?.();
        });

        setCall(myCall);
      } catch (err) {
        setError(err.message);
      }
    };

    init();

    return () => {
      if (call && !leavingRef.current) {
        leavingRef.current = true;
        call.stopClosedCaptions().catch(() => { });
        call.leave().catch(() => { });
      }
    };
  }, [client, callId, userId]);

  const handleLeaveClick = async () => {
    if (leavingRef.current) {
      onLeave?.();
      return;
    }
    leavingRef.current = true;
    try {
      if (call) {
        await call.stopClosedCaptions().catch(() => { });
        await call.leave().catch(() => { });
      }
    } catch (err) {
      console.error("Error leaving call:", err);
    } finally {
      onLeave?.();
    }
  };

  if (error) return <div className="text-white">Error: {error}</div>;
  if (!call) return <div className="text-white">Loading...</div>;

  return (
    <StreamTheme>
      <StreamCall call={call}>
        {/* Main Container: Fixed to screen height, no window scrolling */}
        <div className="h-screen w-full bg-linear-to-br from-gray-900 via-gray-800 to-gray-950 text-white overflow-hidden flex flex-col">

          <div className="flex-1 w-full p-4 h-full box-border min-h-0">
            {/* Grid: Video | Transcript */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 h-full w-full">

              {/* Left Column: Video Area */}
              <div className="flex flex-col gap-4 h-full min-h-0">

                {/* VIDEO CONTAINER - FIXED */}

                <div className="flex-1 w-full rounded-2xl bg-gray-900/50 border border-gray-700/50 overflow-hidden shadow-2xl relative min-h-0 flex flex-col">

                  {/* PaginatedGridLayout handles multiple users perfectly */}
                  <PaginatedGridLayout
                    groupSize={8}

                  />

                </div>

                {/* Controls Bar */}
                <div className="flex justify-center shrink-0">
                  <div className="bg-gray-800/90 backdrop-blur-md rounded-full px-6 py-3 border border-gray-700/50 shadow-xl hover:border-gray-600 transition-colors">
                    <CallControls onLeave={handleLeaveClick} />
                  </div>
                </div>
              </div>

              {/* Right Column: Transcript */}
              <div className="hidden lg:flex flex-col h-full min-h-0 bg-gray-900/50 rounded-2xl border border-gray-700/50 overflow-hidden shadow-2xl backdrop-blur-sm">
                <TranscriptPanel />
              </div>
            </div>
          </div>
        </div>
      </StreamCall>
    </StreamTheme>
  );
}