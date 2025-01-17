import { useRef, useState } from "react";

export interface AudioContextState {
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  currentAudio: HTMLAudioElement | null;
  sourceNode: MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null;
  isInitialized: boolean;
}

export const useAudioContext = (fftSize: number = 32768) => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [, setAudioState] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null>(null);
  const [isMicLoaded, setIsMicLoaded] = useState<boolean>(false);

  const init = () => {

    if (!audioContextRef.current) {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();

      analyser.fftSize = fftSize;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -20;
      analyser.smoothingTimeConstant = 0.85;

      audioContextRef.current = ctx;
      analyserRef.current = analyser;

      setIsInitialized(true);
    }
    setIsMicLoaded(false);
  };

  const loadAudio = async (audioUrl: string): Promise<HTMLAudioElement> => {
    init();
    return new Promise((resolve, reject) => {
      const audio = new Audio();

      audio.addEventListener("canplaythrough", () => {
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
        }
        if (audioContextRef.current && analyserRef.current) {
          if (sourceNodeRef.current) {
            sourceNodeRef.current.disconnect();
          }

          const source =
            audioContextRef.current.createMediaElementSource(audio);
          sourceNodeRef.current = source;

          source.connect(analyserRef.current);
          analyserRef.current.connect(audioContextRef.current.destination);
          currentAudioRef.current = audio;

          setAudioState((prev) => prev + 1);
          resolve(audio);
        }
      });

      audio.addEventListener("error", (e) => {
        reject(
          new Error(
            `Failed to load audio: ${e instanceof ErrorEvent ? e.message : "Unknown error"
            }`
          )
        );
      });

      audio.src = audioUrl;
      audio.load();
    });
  };

  const loadFromMic = async (): Promise<void> => {
    init();
    setIsMicLoaded(true);
    if (audioContextRef.current && analyserRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = audioContextRef.current.createMediaStreamSource(stream);
        sourceNodeRef.current = source;
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);

        audioContextRef.current.resume();

        setAudioState((prev) => prev + 1);
      } catch (error) {
        console.error("Failed to access microphone:", error);
      }
    } else {
      console.error("Audio context or analyser not initialized");
    }
  };

  const stopMic = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();

      // Stop all tracks from the MediaStream
      if (sourceNodeRef.current instanceof MediaStreamAudioSourceNode) {
        const stream = sourceNodeRef.current.mediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
    setIsMicLoaded(false);
  };

  return {
    isInitialized,
    audioContext: audioContextRef.current,
    analyser: analyserRef.current,
    currentAudio: currentAudioRef.current,
    sourceNode: sourceNodeRef.current,
    isMicLoaded,
    loadAudio,
    loadMicrophone,
    stopMicrophone,
    micIsActive,
    init,
    loadFromMic,
    stopMic,
  };
};
