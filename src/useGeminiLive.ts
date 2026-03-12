import { useState, useRef, useCallback } from "react";

export const useGeminiLive = () => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const stopSession = useCallback(() => {
    processorRef.current?.disconnect();
    processorRef.current = null;

    audioContextRef.current?.close();
    audioContextRef.current = null;

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsConnected(false);
    console.log("Session stopped. 🛑");
  }, []);

  const startAudioStream = useCallback((stream: MediaStream, ws: WebSocket) => {
    const audioContext = new AudioContext({ sampleRate: 16000 });
    audioContextRef.current = audioContext;

    const source = audioContext.createMediaStreamSource(stream);
    // ScriptProcessor is deprecated but universally supported; swap for AudioWorklet if needed
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    processor.onaudioprocess = (e) => {
      if (ws.readyState !== WebSocket.OPEN) return;

      const inputData = e.inputBuffer.getChannelData(0);

      // Convert Float32 → PCM16
      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        pcm16[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
      }

      // Base64 encode
      const base64Audio = btoa(
        String.fromCharCode(...new Uint8Array(pcm16.buffer)),
      );

      ws.send(
        JSON.stringify({
          realtime_input: {
            media_chunks: [
              {
                mime_type: "audio/pcm",
                data: base64Audio,
              },
            ],
          },
        }),
      );
    };

    source.connect(processor);
    processor.connect(audioContext.destination);
  }, []);

  const startSession = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 1 } },
        audio: true,
      });
      streamRef.current = stream;

      stream.getVideoTracks()[0].onended = () => stopSession();

      const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
      const URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${API_KEY}`;

      const ws = new WebSocket(URL);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket open, sending setup... 🔧");

        // Step 1: ONLY send setup here, nothing else
        ws.send(
          JSON.stringify({
            setup: {
              model: "models/gemini-2.5-flash-native-audio-latest",
              generation_config: {
                response_modalities: ["AUDIO"],
              },
            },
          }),
        );
      };

      ws.onmessage = async (event) => {
        let rawData = event.data;

        // 1. Handle Blob conversion if necessary
        if (rawData instanceof Blob) {
          rawData = await rawData.text();
        }

        try {
          const response = JSON.parse(rawData);
          console.log("Gemini response:", response);

          // Step 2: Proceed with your logic...
          if (response.setupComplete !== undefined) {
            console.log("Setup complete! Starting session... ✅");
            setIsConnected(true);

            // ... the rest of your sending logic ...
          }

          // Handle audio/transcripts as before
          // ...
        } catch (err) {
          console.error("Failed to parse message:", err, rawData);
        }
      };

      ws.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        stopSession();
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        stopSession();
      };
    } catch (err) {
      console.error("Failed to start session:", err);
      stopSession();
    }
  }, [stopSession, startAudioStream]);

  return { startSession, stopSession, isConnected };
};
