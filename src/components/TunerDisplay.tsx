import { Stage, Layer, Text, Rect } from "react-konva";
import { Peak } from "../utils/frequencyAnalysis";
import { TuningResult } from "../utils/tuner";

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
  const width = 800;
  const height = 400;

  // Guitar notes for reference
  const guitarNotes = {
    E2: 82.41,
    A2: 110.0,
    D3: 146.83,
    G3: 196.0,
    B3: 246.94,
    E4: 329.63,
  };

  const nearestNotes = Object.entries(guitarNotes)
    .sort((a, b) => Math.abs(a[1] - frequency) - Math.abs(b[1] - frequency))
    .slice(0, 3);

  return (
    <Stage width={width} height={height}>
      <Layer>
        {/* Background */}
        <Rect width={width} height={height} fill="rgb(200, 200, 200)" />

        {isInitialized && currentAudio && !currentAudio.paused ? (
          <>
            {frequency > 0 ? (
              <>
                {/* Main frequency display */}
                <Text
                  text={`Note: ${tuningResult.note} (${Math.round(
                    frequency
                  )}Hz)`}
                  x={10}
                  y={10}
                  fontSize={24}
                  fill={tuningResult.inTune ? "green" : "red"}
                />

                {/* Peak information */}
                {lastPeaks && lastPeaks.length > 0 && (
                  <>
                    <Text
                      text="Detected Peaks:"
                      x={10}
                      y={60}
                      fontSize={14}
                      fill="black"
                    />
                    {lastPeaks.map((peak, i) => (
                      <Text
                        key={`peak-${i}`}
                        text={`Peak ${i + 1}: ${peak.frequency.toFixed(
                          1
                        )}Hz (amp: ${peak.amplitude})`}
                        x={10}
                        y={80 + i * 20}
                        fontSize={14}
                        fill="black"
                      />
                    ))}

                    {/* Nearest notes */}
                    <Text
                      text="Nearest Notes:"
                      x={10}
                      y={180}
                      fontSize={14}
                      fill="black"
                    />
                    {nearestNotes.map(([note, noteFreq], i) => (
                      <Text
                        key={`note-${note}`}
                        text={`${note}: ${noteFreq}Hz (diff: ${Math.abs(
                          noteFreq - frequency
                        ).toFixed(1)}Hz)`}
                        x={10}
                        y={200 + i * 20}
                        fontSize={14}
                        fill="black"
                      />
                    ))}
                  </>
                )}
              </>
            ) : (
              <Text
                text="Waiting for audio..."
                x={10}
                y={10}
                fontSize={24}
                fill="black"
              />
            )}
          </>
        ) : (
          <Text
            text="Click a note button to begin"
            x={10}
            y={10}
            fontSize={24}
            fill="black"
          />
        )}
      </Layer>
    </Stage>
  );
};
