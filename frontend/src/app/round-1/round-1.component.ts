import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ExamService } from '../services/exam.service';
import { VideoAudioService } from '../services/video-audio.service';
import { FaceDetectorService } from '../services/face-detector.service';
import { AudioDetectorService } from '../services/audio-detector.service';
import { SpeechService } from '../services/speech.service';

@Component({
  selector: 'app-round1',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './round-1.component.html',
})
export class Round1Component implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('overlayCanvas') overlayCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('audioCanvas') audioCanvas!: ElementRef<HTMLCanvasElement>;

  questions: any[] = [];
  answers: { [key: number]: string } = {};
  submitted = false;
  score = NaN;
  isRecording = false;
  examStarted = false;

  faceStatus = 'No Face Detected';
  faceCount = 0;
  speakingStatus = 'Silent';
  speaking = false;
  recognition: any;
  tabSwitchCount = 0;

  constructor(
    private examService: ExamService,
    private videoAudioService: VideoAudioService,
    private faceDetectorService: FaceDetectorService,
    private audioDetectorService: AudioDetectorService,
    private speechService: SpeechService
  ) {}

  handleVisibilityChange = () => {
    if (!this.examStarted)
      return;
    if (document.visibilityState === 'hidden') {
      this.tabSwitchCount++;
      alert('Tab switching is not allowed during the assessment!');
      // Optionally, end the test/interview here
      // this.examService.endExam(); or redirect user
    }
    if (this.tabSwitchCount >= 2) {
      alert('You switched tabs too many times. Ending session.');
      // End session or mark exam
      for (let q of this.questions){
        this.answers[q.id] = '';
        this.submit();
      }
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

  async ngOnInit() {
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    //window.addEventListener('blur', this.handleBlur);
    //window.addEventListener('focus', this.handleFocus);

    await this.faceDetectorService.loadModels();
    this.examService.getQuestions().subscribe((data) => {
      this.questions = data;
    });
  }
  
  ngOnDestroy(): void {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    //window.removeEventListener('blur', this.handleBlur);
    //window.removeEventListener('focus', this.handleFocus);

  }

  async startRecording() {
    try {
      const stream = await this.videoAudioService.getMediaStream();
      const video = this.videoElement.nativeElement;
      video.srcObject = stream;
      video.muted = true;

      video.onloadedmetadata = () => {
        video.play();
        this.faceDetectorService.detectFaces(video, this.overlayCanvas.nativeElement, (status, count) => {
          this.faceStatus = status;
          this.faceCount = count;
        });

        this.audioDetectorService.startDetection(stream, this.audioCanvas.nativeElement, (status, speaking) => {
          this.speakingStatus = status;
          this.speaking = speaking;
        });

        //this.speechService.restartOnEnd = true;
        this.speechService.start();
      };

      this.videoAudioService.startRecording(stream);
      this.isRecording = true;
      this.examStarted = true;
    } catch (err) {
      alert('Could not start recording: ' + err);
    }
  }

  async stopRecording(): Promise<void> {
    const blob = await this.videoAudioService.stopRecording();
    const stream = this.videoElement.nativeElement.srcObject as MediaStream;
    stream.getTracks().forEach((track) => track.stop());
    this.videoElement.nativeElement.srcObject = null;
    this.audioDetectorService.stop();
    this.speechService.stop();
    console.log("Recording stopped");
  }

  async submit() {
    await this.stopRecording();
    const formData = new FormData();
    formData.append('video', new Blob(this.videoAudioService.recordedChunks, { type: 'video/webm' }), 'exam_recording.webm');
    formData.append('answers', JSON.stringify(this.answers));
    console.log("Submitting");
    this.examService.submitAnswers(formData).subscribe((res: any) => {
      this.score = res.score;
      this.submitted = true;
    });
  }
}
