import { useEffect } from "react";
import { Peak } from "../utils/frequencyAnalysis";
import { TuningResult } from "@/utils/tuner";

interface TunerDisplayProps {
  frequency: number;
  isInitialized: boolean;
  currentAudio: HTMLAudioElement | null;
  tuningResult: TuningResult;
  lastPeaks: Peak[] | null;
}

export const TunerDisplay: React.FC<TunerDisplayProps> = ({
  frequency,
  isInitialized,
  currentAudio,
  tuningResult,
  lastPeaks,
}) => {
  useEffect(() => {
    const canvas = document.getElementById(
      "visualizer-canvas"
    ) as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    let animationFrameId: number;

    const draw = () => {
      animationFrameId = requestAnimationFrame(draw);

      if (isInitialized && currentAudio && !currentAudio.paused) {
        // Clear canvas
        ctx.fillStyle = "rgb(200, 200, 200)";
        ctx.fillRect(0, 0, width, height);

        // Draw tuning information
        if (frequency > 0) {
          ctx.fillStyle = tuningResult.inTune ? "green" : "red";
          ctx.font = "24px Arial";
          ctx.fillText(
            `Note: ${tuningResult.note} (${Math.round(frequency)}Hz)`,
            10,
            30
          );

          // Show detailed peak information
          ctx.fillStyle = "black";
          ctx.font = "14px Arial";
          if (lastPeaks && lastPeaks.length > 0) {
            ctx.fillText("Detected Peaks:", 10, 80);
            lastPeaks.forEach((peak, i) => {
              ctx.fillText(
                `Peak ${i + 1}: ${peak.frequency.toFixed(1)}Hz (amp: ${
                  peak.amplitude
                })`,
                10,
                100 + i * 20
              );
            });

            // Show closest guitar notes
            const guitarNotes = {
              E2: 82.41,
              A2: 110.0,
              D3: 146.83,
              G3: 196.0,
              B3: 246.94,
              E4: 329.63,
            };

            ctx.fillText("Nearest Notes:", 10, 200);
            Object.entries(guitarNotes)
              .sort(
                (a, b) =>
                  Math.abs(a[1] - frequency) - Math.abs(b[1] - frequency)
              )
              .slice(0, 3)
              .forEach((entry, i) => {
                const [note, noteFreq] = entry;
                const diff = Math.abs(noteFreq - frequency);
                ctx.fillText(
                  `${note}: ${noteFreq}Hz (diff: ${diff.toFixed(1)}Hz)`,
                  10,
                  220 + i * 20
                );
              });
          }
        } else {
          ctx.fillStyle = "black";
          ctx.font = "24px Arial";
          ctx.fillText("Waiting for audio...", 10, 30);
        }
      } else {
        ctx.fillStyle = "rgb(200, 200, 200)";
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "black";
        ctx.font = "24px Arial";
        ctx.fillText("Click a note button to begin", 10, 30);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [frequency, isInitialized, currentAudio, tuningResult, lastPeaks]);

  return <canvas id="visualizer-canvas" width={800} height={400} />;
};
