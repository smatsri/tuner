import { useCallback, useState, useEffect, useRef } from "react";
import { useAudioContext } from "../hooks/useAudioContext";
import { findFundamentalFrequency, Peak } from "../utils/frequencyAnalysis";
import { TunerDisplay } from "./TunerDisplay";
import { AudioControls } from "./AudioControls";
import { checkTuning } from "../utils/tuner";

const GuitarTuner: React.FC = () => {
  const [frequency, setFrequency] = useState(0);
  const peaksRef = useRef<Peak[]>([]);

  const {
    isInitialized,
    audioContext,
    analyser,
    currentAudio,
    isMicLoaded,
    loadAudio,
    loadFromMic,
    stopMic,
  } = useAudioContext();

  // Modified effect to handle both microphone and audio file input
  useEffect(() => {
    let animationFrameId: number;
    let isRunning = false;

    // TODO: only update frequency if mic is active or audio is playing
    const updateFrequency = () => {
      if (!isRunning || !analyser) return;

      const [peaks, newFrequency] = findFundamentalFrequency(
        audioContext,
        analyser
      );

      if (newFrequency !== frequency) {
        setFrequency(newFrequency);
      }
      peaksRef.current = peaks;
      animationFrameId = requestAnimationFrame(updateFrequency);
    };

    if (
      (isInitialized && currentAudio && !currentAudio.paused) ||
      isMicLoaded
    ) {
      isRunning = true;
      updateFrequency();
    }

    return () => {
      isRunning = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [
    isInitialized,
    currentAudio,
    audioContext,
    analyser,
    frequency,
    isMicLoaded,
  ]);

  // Add event listeners for audio state changes
  useEffect(() => {
    if (!currentAudio || isMicLoaded) return;

    const handlePlay = () => {
      setFrequency(0); // Reset frequency when starting new audio
    };

    currentAudio.addEventListener("play", handlePlay);

    return () => {
      currentAudio.removeEventListener("play", handlePlay);
    };
  }, [currentAudio, isMicLoaded]);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const audioUrl = URL.createObjectURL(file);
        const audio = await loadAudio(audioUrl);
        audio.play();
      } catch (error) {
        console.error("Failed to load audio file:", error);
      }
    },
    [loadAudio]
  );

  const handleNoteClick = useCallback(
    async (note: string, file: string) => {
      try {
        const audio = await loadAudio(file);
        audio.play();
      } catch (error) {
        console.error(`Failed to play ${note}:`, error);
      }
    },
    [loadAudio]
  );

  const handleMicChange = useCallback(async () => {
    if (isMicLoaded) {
      stopMic();
    } else {
      await loadFromMic();
    }
  }, [loadFromMic, isMicLoaded]);

  const tuningResult = checkTuning(frequency); // Use state frequency instead of direct calculation

  return (
    <div className="guitar-tuner">
      <TunerDisplay
        frequency={frequency}
        isInitialized={isInitialized}
        currentAudio={currentAudio}
        isMicLoaded={isMicLoaded}
        tuningResult={tuningResult}
        lastPeaks={peaksRef.current}
      />

      <AudioControls
        onFileChange={handleFileChange}
        onNoteClick={handleNoteClick}
        handleLoadFromMic={handleMicChange}
      />

      <style>{`
        .guitar-tuner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          padding: 20px;
        }
      `}</style>
    </div>
  );
};

export default GuitarTuner;
