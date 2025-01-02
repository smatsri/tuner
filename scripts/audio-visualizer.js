class AudioVisualizer {
  constructor() {
    // Don't create AudioContext until user interacts
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;

    // Add standard guitar frequencies
    this.guitarNotes = {
      E2: 82.41,
      A2: 110.0,
      D3: 146.83,
      G3: 196.0,
      B3: 246.94,
      E4: 329.63,
    };

    // Tolerance in Hz for considering a note in tune (adjust as needed)
    this.tuneTolerance = 2;
  }

  async init() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    }
    return this.audioContext.resume();
  }

  async loadVideo(videoUrl) {
    await this.init(); // Ensure audio context is initialized
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");

      // Add event listeners for loading states
      video.addEventListener("loadeddata", () => {
        // Create audio source from video only after data is loaded
        const source = this.audioContext.createMediaElementSource(video);
        source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        resolve(video);
      });

      video.addEventListener("error", (e) => {
        reject(new Error(`Failed to load video: ${e.message}`));
      });

      video.src = videoUrl;
      video.load(); // Explicitly start loading the video
    });
  }

  // Add method to find fundamental frequency
  findFundamentalFrequency() {
    const bufferLength = this.analyser.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(frequencyData);

    const sampleRate = this.audioContext.sampleRate;
    let peaks = [];

    // Focus on lower frequencies (adjust range for guitar strings)
    const minFreq = 70; // Just below low E (82.41 Hz)
    const maxFreq = 350; // Just above high E (329.63 Hz)
    const startBin = Math.floor((minFreq * this.analyser.fftSize) / sampleRate);
    const endBin = Math.floor((maxFreq * this.analyser.fftSize) / sampleRate);

    // Find multiple peaks
    for (let i = startBin + 1; i < endBin - 1; i++) {
      if (
        frequencyData[i] > frequencyData[i - 1] &&
        frequencyData[i] > frequencyData[i + 1] &&
        frequencyData[i] > 128
      ) {
        // Amplitude threshold
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
      const difference = Math.abs(frequency - noteFreq);
      if (difference < smallestDifference) {
        smallestDifference = difference;
        closestNote = note;
      }
    }

    const inTune = smallestDifference <= this.tuneTolerance;
    const needsHigher = frequency < this.guitarNotes[closestNote];

    return {
      note: closestNote,
      inTune,
      needsHigher,
      difference: smallestDifference,
    };
  }

  draw(canvas) {
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // Store previous data points for scrolling effect
    let dataHistory = [];
    const historyLength = 100; // Number of frames to show

    const draw = () => {
      requestAnimationFrame(draw);

      // Get current audio data
      this.analyser.getByteTimeDomainData(this.dataArray);

      // Get frequency and tuning information
      const frequency = this.findFundamentalFrequency();
      const tuning = this.checkTuning(frequency);

      // Add current data to history
      dataHistory.push([...this.dataArray]);
      if (dataHistory.length > historyLength) {
        dataHistory.shift();
      }

      // Clear canvas
      ctx.fillStyle = "rgb(200, 200, 200)";
      ctx.fillRect(0, 0, width, height);

      // Draw tuning indicator
      if (frequency > 0) {
        // Only show tuning info if we detect a frequency
        ctx.fillStyle = tuning.inTune ? "green" : "red";
        ctx.font = "24px Arial";
        ctx.fillText(
          `Note: ${tuning.note} (${Math.round(frequency)}Hz)`,
          10,
          30
        );
        ctx.fillText(
          tuning.inTune
            ? "In Tune!"
            : tuning.needsHigher
            ? "Tune Higher ↑"
            : "Tune Lower ↓",
          10,
          60
        );

        // Debug information - show top 3 detected frequencies
        ctx.fillStyle = "black";
        ctx.font = "16px Arial";
        if (this.lastPeaks) {
          this.lastPeaks.forEach((peak, i) => {
            ctx.fillText(
              `Peak ${i + 1}: ${Math.round(peak.frequency)}Hz (${
                peak.amplitude
              })`,
              10,
              100 + i * 20
            );
          });
        }
      } else {
        ctx.fillStyle = "black";
        ctx.font = "24px Arial";
        ctx.fillText("Waiting for input...", 10, 30);
      }

      // Draw each frame in history
      const frameWidth = width / historyLength;

      dataHistory.forEach((frame, frameIndex) => {
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgba(0, 0, 0, ${frameIndex / historyLength})`;

        const sliceWidth = frameWidth / frame.length;
        let x = frameIndex * frameWidth;

        for (let i = 0; i < frame.length; i++) {
          const v = frame[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.stroke();
      });
    };

    draw();
  }
}
