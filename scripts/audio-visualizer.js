class AudioVisualizer {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.currentAudio = null;
    this.isInitialized = false;
    this.fftSize = 32768;

    this.guitarNotes = {
      E2: { freq: 82.41, file: "./audio/e2.mp3" },
      A2: { freq: 110.0, file: "./audio/a2.mp3" },
      D3: { freq: 146.83, file: "./audio/d3.mp3" },
      G3: { freq: 196.0, file: "./audio/g3.mp3" },
      B3: { freq: 246.94, file: "./audio/b3.mp3" },
      E4: { freq: 329.63, file: "./audio/e4.mp3" },
    };

    this.tuneTolerance = 2;
  }

  async init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();

      // Configure analyser
      this.analyser.fftSize = this.fftSize;
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -20;
      this.analyser.smoothingTimeConstant = 0.85;

      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.isInitialized = true;
    }
  }

  draw(canvas) {
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    const draw = () => {
      requestAnimationFrame(draw);

      // Only process audio if initialized and we have an audio source
      if (
        this.isInitialized &&
        this.currentAudio &&
        !this.currentAudio.paused
      ) {
        const frequency = this.findFundamentalFrequency();
        const tuning = this.checkTuning(frequency);

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
          if (this.lastPeaks && this.lastPeaks.length > 0) {
            ctx.fillText("Detected Peaks:", 10, 80);
            this.lastPeaks.forEach((peak, i) => {
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
            Object.entries(this.guitarNotes)
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
        // Clear canvas and show waiting message
        ctx.fillStyle = "rgb(200, 200, 200)";
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "black";
        ctx.font = "24px Arial";
        ctx.fillText("Click a note button to begin", 10, 30);
      }
    };

    draw();
  }

  async loadAudio(audioUrl) {
    await this.init();
    return new Promise((resolve, reject) => {
      const audio = new Audio();

      audio.addEventListener("canplaythrough", () => {
        if (this.currentAudio) {
          // Disconnect old audio source if it exists
          this.currentAudio.pause();
        }
        const source = this.audioContext.createMediaElementSource(audio);
        source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        this.currentAudio = audio;
        resolve(audio);
      });

      audio.addEventListener("error", (e) => {
        reject(new Error(`Failed to load audio: ${e.message}`));
      });

      audio.src = audioUrl;
      audio.load();
    });
  }

  // Add method to find fundamental frequency
  findFundamentalFrequency() {
    const bufferLength = this.analyser.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(frequencyData);

    const sampleRate = this.audioContext.sampleRate;
    let peaks = [];

    // Adjusted frequency range
    const minFreq = 60;
    const maxFreq = 350;
    const startBin = Math.floor((minFreq * this.analyser.fftSize) / sampleRate);
    const endBin = Math.floor((maxFreq * this.analyser.fftSize) / sampleRate);

    // Enhanced peak detection
    for (let i = startBin + 2; i < endBin - 2; i++) {
      // Check for wider peaks (better for low frequencies)
      if (
        frequencyData[i] > frequencyData[i - 1] &&
        frequencyData[i] > frequencyData[i - 2] &&
        frequencyData[i] > frequencyData[i + 1] &&
        frequencyData[i] > frequencyData[i + 2] &&
        frequencyData[i] > 120
      ) {
        peaks.push({
          index: i,
          value: frequencyData[i],
        });
      }
    }

    // Sort peaks by amplitude
    peaks.sort((a, b) => b.value - a.value);

    // If no peaks found
    if (peaks.length === 0) return 0;

    // Get the frequency of the strongest peak
    const frequency = (peaks[0].index * sampleRate) / this.analyser.fftSize;

    // Store all detected peaks for debugging
    this.lastPeaks = peaks.slice(0, 3).map((peak) => ({
      frequency: (peak.index * sampleRate) / this.analyser.fftSize,
      amplitude: peak.value,
    }));

    return frequency;
  }

  // Add method to check if note is in tune
  checkTuning(frequency) {
    let closestNote = null;
    let smallestDifference = Infinity;

    for (const [note, noteFreq] of Object.entries(this.guitarNotes)) {
      const difference = Math.abs(frequency - noteFreq.freq);
      if (difference < smallestDifference) {
        smallestDifference = difference;
        closestNote = note;
      }
    }

    const inTune = smallestDifference <= this.tuneTolerance;
    const needsHigher = frequency < this.guitarNotes[closestNote].freq;

    return {
      note: closestNote,
      inTune,
      needsHigher,
      difference: smallestDifference,
    };
  }
}
