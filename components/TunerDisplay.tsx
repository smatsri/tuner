import { useEffect } from "react";
import { Peak } from "../hooks/useFrequencyAnalyzer";
import { TuningResult } from "@/hooks/useTuner";

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
            // ... rest of the drawing logic ...
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
