import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SpeechService {

  /** Emits every time the buffered transcript changes */
  readonly transcript$ = new Subject<string>();
  ended$ = new Subject<string>();          // <- recreate per session

  private recognition?: SpeechRecognition;
  private buffer = '';                       // running transcript
  private silenceTimer?: any;                // watchdog
  private readonly SILENCE_LIMIT = 3000;     // ms with no speech → auto-stop

  /* ───────── public API ───────── */

  /** Begin recognising (does nothing if already running) */
  start(): void {
    if (this.recognition) { return; }

    this.ended$ = new Subject<string>();

    const Ctor =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;

    if (!Ctor) {
      alert('Speech Recognition is not supported in this browser');
      return;
    }
    

    const rec = new Ctor() as SpeechRecognition;
    rec.continuous     = true;   // keep mic open
    rec.interimResults = true;   // we want interim events for keep-alive
    rec.lang           = 'en-US';

    /* ------------ helpers ------------- */

    const resetSilenceTimer = () => {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = setTimeout(() => {
        console.log('[SR] silence timeout → stop()');
        this.stop();             // graceful shutdown after real pause
      }, this.SILENCE_LIMIT);
    };

    /* ------------ handlers ------------- */


    rec.onresult = e => {
      let chunk = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        chunk += e.results[i][0].transcript;
      }
      console.log('[SR] onresult:', chunk);

      // Append (only once!) when we get a FINAL result
      // e.results[i].isFinal is reliable with interimResults = true
      if (e.results[e.results.length - 1].isFinal) {
        this.buffer += (`${chunk} `).trim() + ' ';
      }

      this.transcript$.next((this.buffer + chunk).trim()); // live feed
      resetSilenceTimer();                                 // keep-alive
    };

    rec.onerror = err => console.error('Speech-Recognition error:', err.error);

    rec.onend = () => {
      console.log('[SR] onend');
      clearTimeout(this.silenceTimer);

      /* emit FINAL text, then clean up */
      const finalTxt = this.buffer.trim();
      console.log("FINAL TEXT:",finalTxt);
      this.ended$.next(finalTxt);
      this.ended$.complete();

      this.buffer = '';               // safe to wipe *after* emit
      this.recognition = undefined;
    };

    /* ------------ go! ------------- */
    this.buffer = '';
    this.recognition = rec;
    rec.start();
  }

  /** Finish recognition and return captured text */
  /** Ask the recogniser to stop (does *not* clear buffer now) */
  stop(): void {
    clearTimeout(this.silenceTimer);
    this.recognition?.stop();   // will trigger onend
  }
}
