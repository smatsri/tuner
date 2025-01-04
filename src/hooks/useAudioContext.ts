import { useRef, useState } from "react";

export interface AudioContextState {
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  currentAudio: HTMLAudioElement | null;
  sourceNode: MediaElementAudioSourceNode | null;
  isInitialized: boolean;
}

export const useAudioContext = (fftSize: number = 32768) => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [, setAudioState] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const [microphoneStream, setMicrophoneStream] = useState<MediaStream | null>(
    null
  );
  const [micIsActive, setMicIsActive] = useState<boolean>(false);

  const init = () => {
    // Clean up existing microphone stream if it exists
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
      setMicrophoneStream(null);
      setMicIsActive(false);
    }

    // Clean up existing audio context and analyser
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }

    // Create new audio context and analyser
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();

    analyser.fftSize = fftSize;
    analyser.minDecibels = -90;
    analyser.maxDecibels = -20;
    analyser.smoothingTimeConstant = 0.85;

    audioContextRef.current = ctx;
    analyserRef.current = analyser;

    setIsInitialized(true);
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
            `Failed to load audio: ${
              e instanceof ErrorEvent ? e.message : "Unknown error"
            }`
          )
        );
      });

      audio.src = audioUrl;
      audio.load();
    });
  };

  const loadMicrophone = async () => {
    try {
      init();
      if (!audioContextRef.current) return;

      // If microphone is already active, stop it
      if (microphoneStream) {
        microphoneStream.getTracks().forEach((track) => track.stop());
        setMicrophoneStream(null);
        setMicIsActive(false);
        return;
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      setMicrophoneStream(stream);

      // Connect microphone to audio context
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current!);
      analyserRef.current!.connect(audioContextRef.current.destination);

      setMicIsActive(true);
      setAudioState((prev) => prev + 1);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setMicIsActive(false);
    }
  };

  const stopMicrophone = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
  };

  return {
    isInitialized,
    audioContext: audioContextRef.current,
    analyser: analyserRef.current,
    currentAudio: currentAudioRef.current,
    sourceNode: sourceNodeRef.current,
    loadAudio,
    loadMicrophone,
    stopMicrophone,
    micIsActive,
    init,
  };
};
