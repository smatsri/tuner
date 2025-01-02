"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface GuitarNote {
  freq: number;
  file: string;
}

interface TuningResult {
  note: string | null;
  inTune: boolean;
  needsHigher: boolean;
  difference: number;
}

interface Peak {
  frequency: number;
  amplitude: number;
}

const AudioVisualizer: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const lastPeaksRef = useRef<Peak[] | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  const FFT_SIZE = 32768;
  const TUNE_TOLERANCE = 2;

  const GUITAR_NOTES: Record<string, GuitarNote> = {
    E2: { freq: 82.41, file: "./audio/e2.mp3" },
    A2: { freq: 110.0, file: "./audio/a2.mp3" },
    D3: { freq: 146.83, file: "./audio/d3.mp3" },
    G3: { freq: 196.0, file: "./audio/g3.mp3" },
    B3: { freq: 246.94, file: "./audio/b3.mp3" },
    E4: { freq: 329.63, file: "./audio/e4.mp3" },
  };

  const init = async (): Promise<void> => {
    if (!audioContextRef.current) {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();

      analyser.fftSize = FFT_SIZE;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -20;
      analyser.smoothingTimeConstant = 0.85;

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      setIsInitialized(true);
    }
  };

  const findFundamentalFrequency = (): number => {
    const analyser = analyserRef.current;
    const audioContext = audioContextRef.current;
    if (!analyser || !audioContext) return 0;

    const bufferLength = analyser.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(frequencyData);

    const sampleRate = audioContext.sampleRate;
    const peaks: Array<{ index: number; value: number }> = [];

    // Adjusted frequency range
    const minFreq = 60;
    const maxFreq = 350;
    const startBin = Math.floor((minFreq * analyser.fftSize) / sampleRate);
    const endBin = Math.floor((maxFreq * analyser.fftSize) / sampleRate);

    // Enhanced peak detection
    for (let i = startBin + 2; i < endBin - 2; i++) {
      if (
        frequencyData[i] > frequencyData[i - 1] &&
        frequencyData[i] > frequencyData[i - 2] &&
        frequencyData[i] > frequencyData[i + 1] &&
        frequencyData[i] > frequencyData[i + 2] &&
        frequencyData[i] > 120
      ) {
        peaks.push({ index: i, value: frequencyData[i] });
      }
    }

    peaks.sort((a, b) => b.value - a.value);
    if (peaks.length === 0) return 0;

    const frequency = (peaks[0].index * sampleRate) / analyser.fftSize;

    lastPeaksRef.current = peaks.slice(0, 3).map((peak) => ({
      frequency: (peak.index * sampleRate) / analyser.fftSize,
      amplitude: peak.value,
    }));

    return frequency;
  };

  const checkTuning = (frequency: number): TuningResult => {
    let closestNote: string | null = null;
    let smallestDifference = Infinity;

    for (const [note, noteFreq] of Object.entries(GUITAR_NOTES)) {
      const difference = Math.abs(frequency - noteFreq.freq);
      if (difference < smallestDifference) {
        smallestDifference = difference;
        closestNote = note;
      }
    }

    if (!closestNote)
      return {
        note: null,
        inTune: false,
        needsHigher: false,
        difference: Infinity,
      };

    const inTune = smallestDifference <= TUNE_TOLERANCE;
    const needsHigher = frequency < GUITAR_NOTES[closestNote].freq;

    return {
      note: closestNote,
      inTune,
      needsHigher,
      difference: smallestDifference,
    };
  };

  const loadAudio = async (audioUrl: string): Promise<HTMLAudioElement> => {
    await init();
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

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      }

      try {
        const audioUrl = URL.createObjectURL(file);
        const audio = await loadAudio(audioUrl);
        audio.play();
      } catch (error) {
        console.error("Failed to load audio file:", error);
      }
    },
    []
  );

  const handleNoteClick = useCallback(async (note: string, file: string) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }

    try {
      const audio = await loadAudio(file);
      audio.play();
    } catch (error) {
      console.error(`Failed to play ${note}:`, error);
    }
  }, []);

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

      if (
        isInitialized &&
        currentAudioRef.current &&
        !currentAudioRef.current.paused
      ) {
        const frequency = findFundamentalFrequency();
        const tuning = checkTuning(frequency);

        // Clear canvas
        ctx.fillStyle = "rgb(200, 200, 200)";
        ctx.fillRect(0, 0, width, height);

        // Draw tuning information
        if (frequency > 0) {
          ctx.fillStyle = tuning.inTune ? "green" : "red";
          ctx.font = "24px Arial";
          ctx.fillText(
            `Note: ${tuning.note} (${Math.round(frequency)}Hz)`,
            10,
            30
          );

          // Show detailed peak information
          ctx.fillStyle = "black";
          ctx.font = "14px Arial";
          if (lastPeaksRef.current && lastPeaksRef.current.length > 0) {
            ctx.fillText("Detected Peaks:", 10, 80);
            lastPeaksRef.current.forEach((peak, i) => {
              ctx.fillText(
                `Peak ${i + 1}: ${peak.frequency.toFixed(1)}Hz (amp: ${
                  peak.amplitude
                })`,
                10,
                100 + i * 20
              );
            });

            // Show closest guitar notes
            ctx.fillText("Nearest Notes:", 10, 200);
            Object.entries(GUITAR_NOTES)
              .sort(
                (a, b) =>
                  Math.abs(a[1].freq - frequency) -
                  Math.abs(b[1].freq - frequency)
              )
              .slice(0, 3)
              .forEach((entry, i) => {
                const [note, data] = entry;
                const diff = Math.abs(data.freq - frequency);
                ctx.fillText(
                  `${note}: ${data.freq}Hz (diff: ${diff.toFixed(1)}Hz)`,
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
  }, [isInitialized]);

  return (
    <div className="audio-visualizer">
      <canvas id="visualizer-canvas" width={800} height={400} />

      {/* File Input Section */}
      <div className="file-input-container">
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="audio-file-input"
        />
      </div>

      {/* Note Buttons Section */}
      <div className="note-buttons">
        {Object.entries(GUITAR_NOTES).map(([note, data]) => (
          <button
            key={note}
            onClick={() => handleNoteClick(note, data.file)}
            className="note-button"
          >
            {note}
          </button>
        ))}
      </div>

      <style jsx>{`
        .audio-visualizer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          padding: 20px;
        }

        .file-input-container {
          margin: 20px 0;
        }

        .note-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .note-button {
          padding: 10px 20px;
          font-size: 16px;
          cursor: pointer;
          background-color: #f0f0f0;
          border: 1px solid #ccc;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .note-button:hover {
          background-color: #e0e0e0;
        }

        .audio-file-input {
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default AudioVisualizer;
