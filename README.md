# 🎯 MeetIQ - Smart Meeting Assistant

**MeetIQ** is a next-generation video conferencing platform powered by AI. It features a real-time **AI Meeting Assistant** that listens passively, transcribes conversations, and answers questions about the meeting context on command.

Built with **Next.js**, **Python**, **Stream SDK**, and **Google Gemini**.

---

## ✨ Features

- **📹 High-Quality Video Calls:** Reliable, low-latency video conferencing using Stream's Edge network.
- **🤖 AI Assistant (Gemini):** A "Passive Mode" bot that joins meetings and listens silently.
- **🗣️ Voice Activation:** The bot only speaks when triggered by the phrase **"Hey Assistant"**.
- **📝 Live Transcription:** Real-time speech-to-text displayed in a smart side panel.
- **🧠 Context-Aware Q&A:** Ask the assistant for summaries, action items, or clarifications based on the last 30 lines of conversation.
- **⚡ Smart UX:**
  - **"Thinking..." Indicator:** Visual feedback when the AI is processing.
  - **Cooldown Timer:** Prevents the bot from stuttering or replying twice.
  - **Responsive Grid:** Automatically adjusts layout for 1 to 16+ participants.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Styling:** Tailwind CSS, ShadcnUI
- **Video/Audio:** [Stream Video SDK](https://getstream.io/video/)
- **Icons:** Lucide React

### **Backend**
- **Runtime:** Python 3.13
- **AI Framework:** [Vision Agents](https://github.com/vision-agents)
- **LLM:** Google Gemini 1.5 Flash (Realtime API)
- **Infrastructure:** Asyncio, Webhooks

---

## 📂 Folder Structure

```bash
meetiq/
├── frontend/             # Next.js Application
│   ├── app/              # App Router pages
│   ├── components/       # UI Components (TranscriptPanel, etc.)
│   └── .env.local        # Frontend Environment Variables
│
├── backend/              # Python AI Agent
│   ├── main.py           # Main Bot Logic
│   ├── requirements.txt  # Python Dependencies
│   └── .env              # Backend Environment Variables
│
└── README.md             # Project Documentation
```
## 🚀 Getting Started

Follow these steps to run the project locally.

### 1. Clone the Repository
```bash
git clone [https://github.com/YOUR_USERNAME/meetiq.git](https://github.com/YOUR_USERNAME/meetiq.git)
cd meetiq
```
### 2. Backend Setup (The AI Bot)
Navigate to the backend folder and set up the Python environment.

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```
Configure Environment Variables: Create a .env file in the backend/ folder:
```bash
# Get these from getstream.io dashboard
STREAM_API_KEY=your_stream_key
STREAM_API_SECRET=your_stream_secret

# Get this from Google AI Studio
GOOGLE_API_KEY=your_gemini_key

# Unique ID for the meeting room
CALL_ID=demo-room-1
```
Run the Bot:
```bash
.venv\Scripts\activate
python main.py
```
### 3. Frontend Setup (The Client)
Open a new terminal and navigate to the frontend folder.
```bash
cd frontend

# Install dependencies
npm install
# or
yarn install
```
Configure Environment Variables: Create a .env.local file in the frontend/ folder:
```bash
NEXT_PUBLIC_STREAM_API_KEY=your_stream_key
NEXT_PUBLIC_CALL_ID=demo-room-1
```
Run the App:
```bash
npm run dev
```
### 4. Usage
Open http://localhost:3000 in your browser.

Enter your name and click Join Meeting.

The Python backend will automatically join the call as "Meeting Assistant".

Speak naturally. To ask the AI a question, say:

"Hey Assistant, what did we just talk about?"

## 👤 Author
Kaushalendra Pratap

Role: Full Stack Developer

Focus: Building AI-driven applications and scalable web solutions.
