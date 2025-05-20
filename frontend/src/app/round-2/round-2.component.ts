import { Component, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpeechService } from '../services/speech.service';
import { TranscriptService } from '../services/transcript.service';
import { ExamService } from '../services/exam.service';
import { FaceDetectorService } from '../services/face-detector.service';
import { VideoAudioService } from '../services/video-audio.service';
import { AudioDetectorService } from '../services/audio-detector.service';

@Component({
  selector: 'app-round-2',
  templateUrl: './round-2.component.html',
  styleUrls: ['./round-2.component.scss'],
  imports : [CommonModule]
})
export class Round2Component implements OnInit, OnDestroy{
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('overlayCanvas') overlayCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('rippleCanvas') rippleCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('audioCanvas') audioCanvas!: ElementRef<HTMLCanvasElement>;
  rippleInterval: any;
  rippleCircles: any[] = [];
  score = 0;
  private sessionId = ''; 
  isQuestioning = false;
  isRecording = false;

  // Max number of questions to ask
  maxQuestions = 5;
  faceStatus = 'No Face Detected';
  faceCount = 0;
  tabSwitchCount = 0;

  constructor(
    private speechService: SpeechService, 
    private transcriptService: TranscriptService,
    private examService: ExamService,
    private faceDetectorService: FaceDetectorService,
    private videoAudioService: VideoAudioService,
    private audioDetectorService: AudioDetectorService

  ) {}

  handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      this.tabSwitchCount++;
      alert('Tab switching is not allowed during the exam/interview!');
      // Optionally, end the test/interview here
      // this.examService.endExam(); or redirect user
    }
    if (this.tabSwitchCount >= 2) {
      alert('You switched tabs too many times. Ending session.');
      // End session or mark exam
      this.score = 0;
      this.examService.saveScores(0);
    } else {
      alert(`Tab switching detected (${this.tabSwitchCount}/2). Please stay on the page.`);
    }
  };

  handleBlur = () => {
    alert('You switched away from the tab. Please stay on this page!');
  };

  handleFocus = () => {
    console.log('User returned to the tab');
  };

  async ngOnInit(){
    speechSynthesis.cancel();
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    //window.addEventListener('blur', this.handleBlur);
    //window.addEventListener('focus', this.handleFocus);
    await this.faceDetectorService.loadModels();
  }

  ngOnDestroy(): void {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    //window.removeEventListener('blur', this.handleBlur);
    //window.removeEventListener('focus', this.handleFocus);
  }

  async startVideo() {
    try {
      const stream = await this.videoAudioService.getMediaStream();
      const video = this.videoElement.nativeElement;
      video.srcObject = stream;
      video.muted = true;

      video.onloadedmetadata = () => {
        video.play();
        const canvas = this.overlayCanvas.nativeElement;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        this.faceDetectorService.detectFaces(video, canvas, (status, count) => {
          this.faceStatus = status;
          this.faceCount = count;
        });
      };

      this.videoAudioService.startRecording(stream);
    } catch (err) {
      alert('Could not start video: ' + err);
    }
  }

  async stopVideo(): Promise<void> {
    const blob = await this.videoAudioService.stopRecording();
    const stream = this.videoElement.nativeElement.srcObject as MediaStream;
    stream.getTracks().forEach((track) => track.stop());
    this.videoElement.nativeElement.srcObject = null;
    this.audioDetectorService.stop();
    console.log("Video stopped");
  }

  async startAIQuestioningLoop() {

    await this.startVideo();

    let question = "Hi. Tell me about yourself.";
    let count = 0;

    while (question && count < this.maxQuestions) {
      // 1) Play question with animation and wait for it to finish
      await this.playQuestionWithAnimation(question);

      // 2) Record user answer until silence or timeout, then get transcript
      const transcript = await this.getUserAnswer();

      // 3) Send transcript to backend and wait for reply
      try {
        const reply = await this.sendTranscript(transcript, this.sessionId);

        // 4) Update score, sessionId and get next question
        this.score += reply.score;
        this.sessionId = reply.session_id;
        question = reply.next_question;

        count++;
      } catch (err) {
        console.error('Error from backend:', err);
        break; // Exit loop on error
      }
    }

    console.log('Questioning complete');
    const percentScore = this.score / (this.maxQuestions) * 100
    console.log("OVERALL SCORE:",percentScore," - ",this.score,"/",this.maxQuestions);
    //this.examService.saveScores(percentScore);

    await this.stopVideo();

  }

  // Plays speech and ripple animation, resolves when speech ends
  playQuestionWithAnimation(text: string): Promise<void> {
    return new Promise((resolve) => {
      this.isQuestioning = true;
      this.startRipples();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';

      utterance.onend = () => {
        this.isQuestioning = false;
        this.stopRipples();
        resolve();
      };

      speechSynthesis.speak(utterance);
    });
  }

  // Start recording user answer and return transcript when done
  getUserAnswer(): Promise<string> {
    return new Promise(resolve => {
      this.speechService.start();
      this.isRecording = true;

      const sub = this.speechService.ended$.subscribe(finalText => {
        // recogniser has really finished
        this.isRecording = false;
        sub.unsubscribe();          // tidy up
        resolve(finalText);         // continue AI flow
      });
    });
  }

  // Sends transcript to backend, returns Promise of backend reply
  sendTranscript(transcript: string, sessionId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.transcriptService.sendTranscript(transcript, sessionId).subscribe({
        next: (reply) => resolve(reply),
        error: (err) => reject(err)
      });
    });
  }

  // ... your existing ripple methods (startRipples, stopRipples) unchanged

  startRipples() {
    const canvas = this.rippleCanvas.nativeElement;
    const ctx = canvas.getContext('2d')!;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const originX = canvas.width / 2;
    const originY = canvas.height / 2;

    const maxRadius = Math.min(canvas.width, canvas.height) / 2;
    const startRadius = maxRadius * 0.75; // Start from ¾ of max radius

    this.rippleCircles = [];

    this.rippleInterval = setInterval(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Occasionally add a new ripple starting at larger radius
      if (Math.random() < 0.04) {
        this.rippleCircles.push({
          radius: startRadius, // ⬅️ Start at ¾ radius
          alpha: 1
        });
      }

      // Draw and animate ripples
      for (let i = this.rippleCircles.length - 1; i >= 0; i--) {
        const ripple = this.rippleCircles[i];
        ripple.radius += 2;
        ripple.alpha -= 0.01;

        ctx.beginPath();
        ctx.arc(originX, originY, ripple.radius, 0, 2 * Math.PI);
        ctx.strokeStyle = `rgba(0, 191, 255, ${ripple.alpha})`;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(0, 191, 255, 0.4)";
        ctx.stroke();

        if (ripple.alpha <= 0) {
          this.rippleCircles.splice(i, 1);
        }
      }
    }, 30);
  }

  stopRipples() {
    clearInterval(this.rippleInterval);
    this.rippleCircles = [];
    const canvas = this.rippleCanvas.nativeElement;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}