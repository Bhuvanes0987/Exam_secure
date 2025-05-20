import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class InterviewService {
  private base = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  /** POST answer, receive evaluation + next question */
  evaluateAnswer(answer: string, qId: string | number) {
    return this.http.post<{nextQuestion: string, score: number}>(`${this.base}/interview`, { answer, qId });
  }
}
