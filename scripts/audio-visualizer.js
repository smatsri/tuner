class AudioVisualizer {
  constructor() {
    /** @type {AudioContext} */
    this.audioContext = new AudioContext();
    /** @type {AnalyserNode} */
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    /** @type {Uint8Array} */
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  async loadVideo(videoUrl) {
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

    const draw = () => {
      requestAnimationFrame(draw);

      this.analyser.getByteTimeDomainData(this.dataArray);

      ctx.fillStyle = "rgb(200, 200, 200)";
      ctx.fillRect(0, 0, width, height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgb(0, 0, 0)";
      ctx.beginPath();

      const sliceWidth = width / this.analyser.frequencyBinCount;
      let x = 0;

      for (let i = 0; i < this.analyser.frequencyBinCount; i++) {
        const v = this.dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
    };

    draw();
  }
}
