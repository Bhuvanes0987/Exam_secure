import { Injectable } from '@angular/core';
import * as faceapi from 'face-api.js';

@Injectable({ providedIn: 'root' })

export class FaceDetectorService {

  async loadModels() {
    await faceapi.nets.tinyFaceDetector.loadFromUri('assets/models');
  }

  detectFaces(video: HTMLVideoElement, canvas: HTMLCanvasElement, callback: (status: string, count: number) => void) {
    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    const context = canvas.getContext('2d');
    const options = new faceapi.TinyFaceDetectorOptions();

    setInterval(async () => {
      const detections = await faceapi.detectAllFaces(video, options);
      const resized = faceapi.resizeResults(detections, displaySize);
      context?.clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resized);

      const count = detections.length;
      if (count === 0) callback('No Face Detected', 0);
      else if (count === 1) callback('Face Detected', 1);
      else callback('Multiple Faces Detected', -1);
    }, 500);
  }
}
