class AudioVisualizer {
  constructor() {
    // Don't create AudioContext until user interacts
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
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

      // Add current data to history
      dataHistory.push([...this.dataArray]);
      if (dataHistory.length > historyLength) {
        dataHistory.shift(); // Remove oldest data
      }

      // Clear canvas
      ctx.fillStyle = "rgb(200, 200, 200)";
      ctx.fillRect(0, 0, width, height);

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
