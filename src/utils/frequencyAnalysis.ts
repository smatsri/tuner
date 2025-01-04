export interface Peak {
  frequency: number;
  amplitude: number;
}

export const findFundamentalFrequency = (
  audioContext: AudioContext | null,
  analyser: AnalyserNode | null
): [Peak[], number] => {
  if (!analyser || !audioContext) return [[], 0];

  const bufferLength = analyser.frequencyBinCount;
  const frequencyData = new Uint8Array(bufferLength);

  analyser.getByteFrequencyData(frequencyData);

  const sampleRate = audioContext.sampleRate;
  const peaks: Array<{ index: number; value: number }> = [];

  const minFreq = 60;
  const maxFreq = 350;
  const startBin = Math.floor((minFreq * analyser.fftSize) / sampleRate);
  const endBin = Math.floor((maxFreq * analyser.fftSize) / sampleRate);

  // Dynamically calculate threshold based on average amplitude
  let sum = 0;
  for (let i = startBin; i < endBin; i++) {
    sum += frequencyData[i];
  }
  const avgAmplitude = sum / (endBin - startBin);
  const threshold = Math.max(avgAmplitude * 1.5, 30); // At least 30 to avoid noise

  for (let i = startBin + 2; i < endBin - 2; i++) {
    if (
      frequencyData[i] > frequencyData[i - 1] &&
      frequencyData[i] > frequencyData[i - 2] &&
      frequencyData[i] > frequencyData[i + 1] &&
      frequencyData[i] > frequencyData[i + 2] &&
      frequencyData[i] > threshold // Using dynamic threshold instead of fixed 120
    ) {
      peaks.push({ index: i, value: frequencyData[i] });
    }
  }

  peaks.sort((a, b) => b.value - a.value);
  if (peaks.length === 0) return [[], 0];

  const frequency = (peaks[0].index * sampleRate) / analyser.fftSize;
  const topPeaks = peaks.slice(0, 3).map((peak) => ({
    frequency: (peak.index * sampleRate) / analyser.fftSize,
    amplitude: peak.value,
  }));

  return [topPeaks, frequency];
};
