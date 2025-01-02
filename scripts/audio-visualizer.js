class AudioVisualizer {
  constructor() {
    this.audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  async loadVideo(videoUrl) {
    const video = document.createElement("video");
    video.src = videoUrl;

    // Create audio source from video
    const source = this.audioContext.createMediaElementSource(video);
    source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    return video;
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
