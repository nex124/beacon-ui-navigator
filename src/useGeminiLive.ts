import { useState, useRef, useCallback } from "react";
import { getSKUDetails } from "./firebase";

export const useGeminiLive = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [volume, setVolume] = useState(0);
  // NEW: Tracking AI state for UI feedback
  const [status, setStatus] = useState<
    "idle" | "listening" | "thinking" | "speaking"
  >("idle");

  const socketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const visionIntervalRef = useRef<number | null>(null);
  const nextStreamTimeRef = useRef<number>(0);

  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  const stopSession = useCallback(() => {
    if (visionIntervalRef.current) clearInterval(visionIntervalRef.current);
    visionIntervalRef.current = null;
    processorRef.current?.disconnect();
    processorRef.current = null;
    if (audioContextRef.current?.state !== "closed")
      audioContextRef.current?.close();
    audioContextRef.current = null;
    // Null the ref BEFORE closing so the onclose guard correctly detects
    // this socket is no longer current, preventing a re-entrant stopSession call.
    const socketToClose = socketRef.current;
    socketRef.current = null;
    socketToClose?.close();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    activeSourcesRef.current = [];
    nextStreamTimeRef.current = 0;
    setIsConnected(false);
    setStatus("idle");
    console.log("Session stopped. 🛑");
  }, []);

  const playReceivedAudio = useCallback(async (base64Data: string) => {
    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    setStatus("speaking"); // Update UI state

    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++)
      bytes[i] = binaryString.charCodeAt(i);

    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 32768;

    const audioBuffer = audioContext.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);

    activeSourcesRef.current.push(source);
    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter(
        (s) => s !== source,
      );
      // If no more audio is playing, go back to idle
      if (activeSourcesRef.current.length === 0) setStatus("idle");
    };

    const startTime = Math.max(
      audioContext.currentTime,
      nextStreamTimeRef.current,
    );
    source.start(startTime);
    nextStreamTimeRef.current = startTime + audioBuffer.duration;
  }, []);

  const sendScreenFrame = useCallback(() => {
    if (
      !videoElementRef.current ||
      socketRef.current?.readyState !== WebSocket.OPEN
    )
      return;

    const video = videoElementRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth; // Sharp HD resolution
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.imageSmoothingEnabled = false; // Keep text crisp
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL("image/png").split(",")[1];

      socketRef.current.send(
        JSON.stringify({
          realtime_input: {
            media_chunks: [{ mime_type: "image/png", data: base64Image }],
          },
        }),
      );
    }
  }, []);

  const startAudioStream = useCallback((stream: MediaStream, ws: WebSocket) => {
    if (!audioContextRef.current) return;
    const audioContext = audioContextRef.current;

    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    let silenceTimer: number | null = null;
    let isUserTalking = false;

    processor.onaudioprocess = (e) => {
      if (ws.readyState !== WebSocket.OPEN) return;
      const inputData = e.inputBuffer.getChannelData(0);

      let peak = 0;
      for (let i = 0; i < inputData.length; i++) {
        const abs = Math.abs(inputData[i]);
        if (abs > peak) peak = abs;
      }

      setVolume(peak * 100);

      if (peak > 0.08) {
        setStatus("listening");
        isUserTalking = true;
        // Clear existing silence timer because user is still talking
        if (silenceTimer) {
          clearTimeout(silenceTimer);
          silenceTimer = null;
        }

        if (activeSourcesRef.current.length > 0) {
          activeSourcesRef.current.forEach((s) => {
            try {
              s.stop();
            } catch (err) {}
          });
          activeSourcesRef.current = [];
          nextStreamTimeRef.current = audioContext.currentTime;
        }
      } else if (isUserTalking && !silenceTimer) {
        // User stopped talking, set a longer timeout before showing "thinking"
        silenceTimer = window.setTimeout(() => {
          setStatus("thinking");
          isUserTalking = false;
          silenceTimer = null;
        }, 2000); // 2 second pause allows user to breathe between sentences
      }

      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        pcm16[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
      }
      const base64Audio = btoa(
        String.fromCharCode(...new Uint8Array(pcm16.buffer)),
      );

      ws.send(
        JSON.stringify({
          realtime_input: {
            media_chunks: [{ mime_type: "audio/pcm", data: base64Audio }],
          },
        }),
      );
    };

    source.connect(processor);
    processor.connect(audioContext.destination);
  }, []);

  const startSession = useCallback(
    async (videoElement: HTMLVideoElement) => {
      videoElementRef.current = videoElement;
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: { ideal: 1 } },
          audio: false,
        });

        // NEW: Stop session automatically when user clicks "Stop sharing" in browser
        screenStream.getVideoTracks().forEach((track) => {
          track.onended = () => {
            console.log("Screen sharing ended by user. Stopping session...");
            stopSession();
          };
        });

        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        const combinedStream = new MediaStream([
          ...screenStream.getVideoTracks(),
          ...micStream.getAudioTracks(),
        ]);

        streamRef.current = combinedStream;
        videoElement.srcObject = screenStream;

        const audioContext = new AudioContext({ sampleRate: 16000 });
        await audioContext.resume();
        audioContextRef.current = audioContext;

        const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
        const URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${API_KEY}`;

        const ws = new WebSocket(URL);
        socketRef.current = ws;

        ws.onopen = () => {
          ws.send(
            JSON.stringify({
              setup: {
                model: "models/gemini-2.5-flash-native-audio-latest",
                tools: [
                  {
                    function_declarations: [
                      {
                        name: "get_sku_details",
                        description:
                          "Get official warehouse records for a SKU to verify stock levels.",
                        parameters: {
                          type: "OBJECT",
                          properties: {
                            sku: {
                              type: "string",
                              description: "The SKU ID, e.g., VB-ALPHA-01",
                            },
                          },
                          required: ["sku"],
                        },
                      },
                    ],
                  },
                ],
                generation_config: {
                  response_modalities: ["AUDIO"],
                },
                system_instruction: {
                  parts: [
                    {
                      text: `You are Beacon, the Onboarding Supervisor. 
                      
                      INTRO: When first greeted, say: "Beacon online. I'm your Onboarding Supervisor. I'm ready to monitor your inventory audit."
                      If the user interrupts or asks a follow-up, DO NOT repeat your intro. Just answer the question immediately.

                      1. EMERGENCY OVERRIDE: If user hovers over Trash/Delete icon, IMMEDIATELY say: "Wait! You're on the delete icon. Type in the number box to edit instead." DO NOT call tools. 
                      2. VERIFICATION: Use 'get_sku_details' only if user asks to check records.
                      3. SPEED & REPORTING:
                      - For warnings: Keep responses under 10 words. Be blunt.
                      - For audits: You may use more words ONLY to clearly state the UI value vs. the Database value (e.g., "The UI shows 10, but Firestore records show 500"). 
                      - Still avoid long explanations or conversational filler.
                      4. UI KNOWLEDGE: There is no pencil icon. Users must click and type in the 'In Stock' box to edit.
                      5. BEHAVIOR: Be professional and alert. If a SKU is not in the database, offer to create a new entry.
                      6. LIMITATIONS (CRITICAL):
                      - You are READ-ONLY. You cannot edit the database or change the UI yourself.
                      - If a change is needed, tell the user: "Please update the value in the input box manually; I cannot edit the records directly."
                      - Never say "I have updated the record" or "I am saving that now."
                      7. LOGIC GUARD:
                      - If asked to "confirm" or "verify" Location or Name: Do NOT call any tools. Simply state what you see on the screen.
                      - If asked to "confirm" or "verify" Stock or Priority: Call 'get_sku_details' to compare against the UI.
                      - If the user asks for information not in the tool, say: "I can see the [Location/Name] on your screen, but my database only tracks Stock and Priority."
                      8. INTERRUPTION HANDLING:
                      - If the user interrupts, stop your current task immediately.
                      - Prioritize the new request over finishing a previous warning or tool call.
                      - If you need a moment to see the screen, say "Looking..." or "Checking the location..." while you process.
                      `,
                    },
                  ],
                },
              },
            }),
          );
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
        };

        ws.onmessage = async (event) => {
          let rawData = event.data;
          if (rawData instanceof Blob) rawData = await rawData.text();

          try {
            const response = JSON.parse(rawData);

            if (response.setupComplete) {
              setIsConnected(true);
              setStatus("idle");
              setTimeout(() => sendScreenFrame(), 500);
              visionIntervalRef.current = window.setInterval(
                sendScreenFrame,
                3000,
              );
              startAudioStream(combinedStream, ws);
              return;
            }

            // Handle toolCall from the server (Gemini Live API format)
            const toolCall = response.toolCall;
            let functionCalls = toolCall?.functionCalls || [];

            // Provide fallback for REST-like parts check just in case
            const parts = response.serverContent?.modelTurn?.parts ?? [];
            if (functionCalls.length === 0) {
              const functionCallParts = parts.filter(
                (p: any) => p.functionCall,
              );
              functionCalls = functionCallParts.map((p: any) => p.functionCall);
            }

            if (functionCalls.length > 0) {
              console.log("🛠️ Received function calls:", functionCalls);
              setStatus("thinking");

              const responses = await Promise.all(
                functionCalls.map(async (call: any) => {
                  if (call.name === "get_sku_details") {
                    try {
                      const skuData = await getSKUDetails(call.args.sku);
                      return {
                        id: call.id,
                        name: call.name,
                        response: {
                          result: skuData ?? { error: "SKU not found" },
                        },
                      };
                    } catch (err) {
                      return {
                        id: call.id,
                        name: call.name,
                        response: { result: { error: "Database error" } },
                      };
                    }
                  }

                  // Fallback for unknown function calls
                  return {
                    id: call.id,
                    name: call.name,
                    response: { result: { error: "Unknown function" } },
                  };
                }),
              );

              ws.send(
                JSON.stringify({
                  toolResponse: {
                    functionResponses: responses,
                  },
                }),
              );

              return;
            }

            const audioPart = parts.find((p: any) => p.inlineData?.data);
            if (audioPart) {
              setStatus("idle"); // The "Think-to-Idle" Safety Switch
              playReceivedAudio(audioPart.inlineData.data);
            }
          } catch (err) {
            console.error("Socket Message Error:", err);
          }
        };

        ws.onclose = (event) => {
          console.error("WebSocket closed:", {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
          });
          // Guard: only stop if this is still the active socket.
          // Without this, the old socket's delayed onclose fires after a new
          // session has already started, killing the new session's refs.
          if (socketRef.current === ws) {
            stopSession();
          }
        };
      } catch (err) {
        console.error("WebSocket closed:", {
          err,
        });
        stopSession();
      }
    },
    [stopSession, startAudioStream, sendScreenFrame, playReceivedAudio],
  );

  return { startSession, stopSession, isConnected, volume, status };
};
