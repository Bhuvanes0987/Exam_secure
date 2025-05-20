import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap, timeout } from 'rxjs/operators';

export interface ChatResponse {
  session_id: string;
  score:      number;
  next_question: string;
}

@Injectable({ providedIn: 'root' })
export class TranscriptService {

  private readonly baseUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  /**
   * Sends the recognised speech to the backend and returns an Observable
   * with the server’s reply. If `transcript` is blank an observable with a
   * dummy response is returned immediately.
   */
  sendTranscript(
    transcript: string,
    sessionId?: string
  ): Observable<ChatResponse> {

    /* ─── nothing to send ─── */
    console.log("RECEIVED TRANSCRIPT:",transcript);
    if (!transcript.trim()) {
      console.log('No speech detected – skipping request.');
      return of({
        session_id: sessionId ?? '',
        score: 0,
        next_question: ''
      });
    }

    /* ─── build request body ─── */
    const body: any = { text: transcript };
    if (sessionId) { body.session_id = sessionId; }

    /* ─── POST /chat ─── */
    const url = `${this.baseUrl}/chat`;

    return this.http.post<ChatResponse>(url, body).pipe(
      tap(res => console.log('Backend reply:', res)),
      catchError(err => {
        console.error('Transcript send failed:', err);
        // Re-emit a safe fallback so subscribers still get something
        return of({
          session_id: sessionId ?? '',
          score: 0,
          next_question: ''
        });
      })
    );
  }
}
