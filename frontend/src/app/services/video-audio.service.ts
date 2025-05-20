import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class VideoAudioService {
  mediaRecorder!: MediaRecorder;
  recordedChunks: Blob[] = [];

  async getMediaStream(): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  }

  startRecording(stream: MediaStream): MediaRecorder {
    this.recordedChunks = [];
    this.mediaRecorder = new MediaRecorder(stream);
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.recordedChunks.push(event.data);
    };
    this.mediaRecorder.start();
    return this.mediaRecorder;
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        resolve(blob);
      };
      this.mediaRecorder.stop();
    });
  }
}
