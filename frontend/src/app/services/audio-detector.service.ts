import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })

export class AudioDetectorService {

  private audioContext!: AudioContext;
  private analyser!: AnalyserNode;

  startDetection(stream: MediaStream, canvas: HTMLCanvasElement, onChange: (status: string, isSpeaking: boolean) => void) {
    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    source.connect(this.analyser);

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const ctx = canvas.getContext('2d')!;

    const draw = () => {
      this.analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
      const isSpeaking = avg > 33;
      onChange(isSpeaking ? 'Sound Detected' : 'Silent', isSpeaking);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = isSpeaking ? 'green' : 'gray';
      ctx.fillRect(0, 10, (avg / 255) * canvas.width, 30);

      requestAnimationFrame(draw);
    };

    draw();
  }

  stop() {
    this.audioContext?.close();
  }
}
