# Beacon: Multimodal AI UI Navigator 🚀

**Beacon** is a real-time, vision-enabled AI agent designed to revolutionize warehouse operations. Built for the **2026 Gemini Live Agent Challenge**, Beacon uses the Gemini 2.5 Flash Live API to provide proactive guidance and error correction by "watching" the user's dashboard and "listening" to their environment.

## 🌟 Key Features

- **Real-time Visual Navigation:** Streams dashboard frames to Gemini 2.5 Flash for proactive UI guidance.
- **Affective Voice Dialogue:** Natural, low-latency voice interaction that understands user intent and tone.
- **Cloud-Synced Intelligence:** Integrated with **Google Cloud Firestore** to provide live stock alerts and priority notes.
- **Error Correction:** Detects invalid inputs or navigation mistakes visually and corrects them via voice.

## 🛠️ Tech Stack

- **Model:** `gemini-2.5-flash-native-audio-latest`
- **Protocol:** WebSockets (BidiGenerateContent)
- **Database:** Google Cloud Firestore (NoSQL)
- **Hosting:** Firebase Hosting (Google Cloud)
- **Frontend:** React + TypeScript

## 🏗️ Architecture

Beacon operates on a bidirectional WebSocket stream:

1. **Sight:** Captured screen frames (JPEG, 1 FPS) are sent as `realtime_input`.
2. **Sound:** User voice (16kHz PCM) is streamed concurrently.
3. **Brain:** Gemini processes multimodal input and cross-references Firestore data.
4. **Action:** Real-time audio responses (24kHz PCM) guide the user.

## 🚀 Getting Started

1. Clone the repo.
2. Create a `.env` file with `VITE_GEMINI_API_KEY=your_key`.
3. Run `npm install` && `npm run dev`.
