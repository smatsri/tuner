import { useRef } from 'react';

export interface Peak {
  frequency: number;
  amplitude: number;
}

export const useFrequencyAnalyzer = (audioContext: AudioContext | null, analyser: AnalyserNode | null) => {
  const lastPeaksRef = useRef<Peak[] | null>(null);

  const findFundamentalFrequency = (): number => {
    if (!analyser || !audioContext) return 0;

    const bufferLength = analyser.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(frequencyData);

    const sampleRate = audioContext.sampleRate;
    const peaks: Array<{ index: number; value: number }> = [];

    const minFreq = 60;
    const maxFreq = 350;
    const startBin = Math.floor((minFreq * analyser.fftSize) / sampleRate);
    const endBin = Math.floor((maxFreq * analyser.fftSize) / sampleRate);

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

  return {
    findFundamentalFrequency,
    lastPeaks: lastPeaksRef.current,
  };
}; 