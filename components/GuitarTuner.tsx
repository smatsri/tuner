"use client";

import { useCallback, useState } from "react";
import { useAudioContext } from "../hooks/useAudioContext";
import { useFrequencyAnalyzer } from "../hooks/useFrequencyAnalyzer";
import { useTuner } from "../hooks/useTuner";
import { TunerDisplay } from "./TunerDisplay";
import { AudioControls } from "./AudioControls";

const GuitarTuner: React.FC = () => {
  const { isInitialized, audioContext, analyser, currentAudio, loadAudio } =
    useAudioContext();
  const { findFundamentalFrequency, lastPeaks } = useFrequencyAnalyzer(
    audioContext,
    analyser
  );
  const { checkTuning } = useTuner();

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

  const currentFrequency = findFundamentalFrequency();
  const tuningResult = checkTuning(currentFrequency);

  return (
    <div className="audio-visualizer">
      <TunerDisplay
        frequency={currentFrequency}
        isInitialized={isInitialized}
        currentAudio={currentAudio}
        tuningResult={tuningResult}
        lastPeaks={lastPeaks}
      />

      <AudioControls
        onFileChange={handleFileChange}
        onNoteClick={handleNoteClick}
      />

      <style jsx>{`
        .audio-visualizer {
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
