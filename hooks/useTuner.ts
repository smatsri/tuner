export interface GuitarNote {
  freq: number;
  file: string;
}

export interface TuningResult {
  note: string | null;
  inTune: boolean;
  needsHigher: boolean;
  difference: number;
}

export const GUITAR_NOTES: Record<string, GuitarNote> = {
  E2: { freq: 82.41, file: "./audio/e2.mp3" },
  A2: { freq: 110.0, file: "./audio/a2.mp3" },
  D3: { freq: 146.83, file: "./audio/d3.mp3" },
  G3: { freq: 196.0, file: "./audio/g3.mp3" },
  B3: { freq: 246.94, file: "./audio/b3.mp3" },
  E4: { freq: 329.63, file: "./audio/e4.mp3" },
};

export const useTuner = (tuneTolerance: number = 2) => {
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

    const inTune = smallestDifference <= tuneTolerance;
    const needsHigher = frequency < GUITAR_NOTES[closestNote].freq;

    return {
      note: closestNote,
      inTune,
      needsHigher,
      difference: smallestDifference,
    };
  };

  return { checkTuning };
}; 