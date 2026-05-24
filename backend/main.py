import asyncio
import os
import logging
import time
from uuid import uuid4
from dotenv import load_dotenv
from aiohttp import web

# Vision Agents imports
from vision_agents.core import agents
from vision_agents.plugins import getstream, gemini
from vision_agents.core.edge.types import User

# Core events
from vision_agents.core.events import (
    CallSessionParticipantJoinedEvent,
    CallSessionParticipantLeftEvent,
    CallSessionStartedEvent,
    CallSessionEndedEvent,
    PluginErrorEvent
)

# LLM events
from vision_agents.core.llm.events import (
    RealtimeUserSpeechTranscriptionEvent, 
    LLMResponseChunkEvent
)

# Setup logging
logging.basicConfig(level=logging.WARNING)

# Manually force our own logger to still show INFO (so we see the bot thinking)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Load environment variables (API Keys)
load_dotenv()

# Meeting data storage
meeting_data = {
    "transcript": [],
    "is_active": False,
    "last_reply_time": 0,  # Cooldown timer to prevent double-replies
    "current_response": "" # Stores the current LLM response
}

async def start_agent(call_id: str):
    logger.info("🤖 Starting Meeting Assistant...")
    logger.info(f"📞 Call ID: {call_id}")
    
    # Create agent with Gemini Realtime
    agent = agents.Agent(
        edge=getstream.Edge(),
        agent_user=User(
            id="meeting-assistant-bot",
            name="Meeting Assistant"
        ),
        # ✅ "Passive Mode" Instructions
        instructions="""
        Role: You are a background Meeting Logger.
        
        Core Behavior:
        - You are in "Passive Mode" by default.
        - In Passive Mode, you ingest audio but generate ZERO text output.
        - You are deaf to all conversation unless addressed directly.
        
        Trigger Condition:
        - You only switch to "Active Mode" if you hear the exact phrase: "Hey Assistant".
        
        Active Mode Protocol:
        1. When "Hey Assistant" is detected, treat the subsequent text as a direct query.
        2. Answer concisely based ONLY on the transcript so far.
        3. Immediately return to Passive Mode after answering.
        
        Summary:
        - Hear "Hey Assistant"? -> Answer.
        - Hear anything else? -> Output nothing. 
        """,
        llm=gemini.Realtime(fps=0),
    )
    
    meeting_data["agent"] = agent
    meeting_data["call_id"] = call_id
    
    # Event: Session Started
    @agent.events.subscribe
    async def handle_session_started(event: CallSessionStartedEvent):
        meeting_data["is_active"] = True
        logger.info("🎙️ Meeting started")
        try:
            channel = agent.edge.client.channel("messaging", call_id)
            await channel.watch()
            meeting_data["channel"] = channel
            logger.info("✅ Chat channel initialized")
        except Exception as e:
            logger.error(f"❌ Chat channel error: {e}")
    
    # Event: Participant tracking
    @agent.events.subscribe
    async def handle_participant_joined(event: CallSessionParticipantJoinedEvent):
        if event.participant.user.id == "meeting-assistant-bot":
            return
        participant_name = event.participant.user.name
        logger.info(f"👤 Participant joined: {participant_name}")
    
    @agent.events.subscribe
    async def handle_participant_left(event: CallSessionParticipantLeftEvent):
        if event.participant.user.id == "meeting-assistant-bot":
            return
        participant_name = event.participant.user.name
        logger.info(f"👋 Participant left: {participant_name}")
    
    # Event: Core Transcription & Logic
    @agent.events.subscribe
    async def handle_transcript(event: RealtimeUserSpeechTranscriptionEvent):
        if not event.text or len(event.text.strip()) == 0:
            return
        
        speaker = getattr(event, 'participant_id', 'Unknown')
        transcript_text = event.text
        
        # 1. Store transcript
        meeting_data["transcript"].append({
            "speaker": speaker,
            "text": transcript_text,
            "timestamp": getattr(event, 'timestamp', None)
        })
        
        logger.info(f"📝 [{speaker}]: {transcript_text}")
        
        # 2. Wake Word Logic ("Hey Assistant")
        if transcript_text.lower().startswith("hey assistant"):
            
            # ✅ Cooldown Check
            current_time = time.time()
            if current_time - meeting_data["last_reply_time"] < 4:
                logger.info("⏳ Cooldown active, ignoring duplicate trigger.")
                return

            question = transcript_text[13:].strip()
            
            if question:
                meeting_data["last_reply_time"] = current_time
                logger.info(f"❓ Q&A triggered: {question}")
                print(f"👀 Assistant heard you! Thinking...")

                # ✅ Send "Typing..." event to Frontend (UX Fix)
                try:
                    if "channel" in meeting_data:
                        await meeting_data["channel"].send_event(
                            event={
                                "type": "typing.start",
                                "user_id": "meeting-assistant-bot"
                            },
                            user_id="meeting-assistant-bot"
                        )
                except Exception as e:
                    logger.error(f"Failed to send typing event: {e}")
                
                # Build context (Limit to last 30 lines for speed)
                recent_history = meeting_data["transcript"][-30:] 
                context = "MEETING TRANSCRIPT (Last 30 lines):\n\n"
                for entry in recent_history:
                    context += f"[{entry['speaker']}]: {entry['text']}\n"
                
                prompt = f"""
                {context}
                
                USER QUESTION: {question}
                
                Answer based ONLY on the meeting transcript above.
                Be concise and helpful.
                """
                
                # Trigger response
                try:
                    meeting_data["current_response"] = ""
                    await agent.simple_response(prompt)
                    
                    # After response finishes, send the accumulated text to the chat channel
                    final_answer = meeting_data["current_response"].strip()
                    if final_answer and "channel" in meeting_data:
                        await meeting_data["channel"].send_message(
                            message={"text": final_answer},
                            user_id="meeting-assistant-bot"
                        )
                        logger.info(f"🤖 Sent response to chat: {final_answer}")
                        
                except Exception as e:
                    logger.error(f"❌ Q&A error: {e}")
    
    # Event: Log Agent Responses
    @agent.events.subscribe
    async def handle_llm_response(event: LLMResponseChunkEvent):
        if hasattr(event, 'delta') and event.delta:
            meeting_data["current_response"] += event.delta
            logger.info(f"🤖 Agent: {event.delta}")
    
    # Event: Cleanup
    @agent.events.subscribe
    async def handle_session_ended(event: CallSessionEndedEvent):
        meeting_data["is_active"] = False
        logger.info("🛑 Meeting ended")
    
    @agent.events.subscribe
    async def handle_errors(event: PluginErrorEvent):
        logger.error(f"❌ Plugin error: {event.error_message}")
        if event.is_fatal:
            logger.error("🚨 Fatal error")
    
    # Lifecycle
    await agent.create_user()
    call = agent.edge.client.video.call("default", call_id)
    
    logger.info("✅ Joining call...")
    
    # Async context manager
    async with agent.join(call):
        logger.info("\n" + "="*60)
        logger.info("🎙️  MEETING ASSISTANT ACTIVE!")
        logger.info("="*60)
        logger.info(f"\n🔗 Meeting ID: {call_id}")
        logger.info("\nPress Ctrl+C to stop\n")
        
        await agent.finish()
    
    logger.info("✅ Agent finished")

def print_meeting_summary():
    print("\n" + "="*70)
    print("📋 MEETING SUMMARY")
    print("="*70)
    print(f"\n📝 Transcript ({len(meeting_data['transcript'])} entries):")
    print("-"*70)
    for entry in meeting_data['transcript']:
        print(f"[{entry['speaker']}]: {entry['text']}")
    print("\n" + "="*70)

if __name__ == "__main__":
    async def health_check(request):
        return web.Response(text="Bot is running!")

    async def start_dummy_server():
        app = web.Application()
        app.router.add_get("/", health_check)
        runner = web.AppRunner(app)
        await runner.setup()
        port = int(os.environ.get("PORT", 8080))
        site = web.TCPSite(runner, "0.0.0.0", port)
        await site.start()
        logger.info(f"🌐 Dummy web server started on port {port}")

    async def main():
        call_id = os.getenv("CALL_ID", f"meeting-{uuid4().hex[:8]}")
        # 1. Start the fake web server so Render doesn't kill us
        await start_dummy_server()
        # 2. Start the actual AI bot
        await start_agent(call_id)

    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n🛑 Stopped by user")
    finally:
        if meeting_data["transcript"]:
            print_meeting_summary()