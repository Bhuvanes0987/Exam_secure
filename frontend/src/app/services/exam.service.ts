import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';


export interface Question {
  id: number;
  question: string;
  answer: string; // optional, omit on frontend if it's only for checking
}

@Injectable({ providedIn: 'root' })
export class ExamService {
  baseUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  getQuestions(): Observable<Question[]>{
    return this.http.get<Question[]>(`${this.baseUrl}/questions`);
  }

  submitAnswers(formData: any) {
    return this.http.post<any>(`${this.baseUrl}/submit`, formData);
  }

  saveScores(percentScore: number) {
    const formData = new FormData();
    const email = sessionStorage.getItem('email');
    if (!email)
      return;
    formData.append("email",email);
    formData.append("percentScore",JSON.stringify(percentScore));
    return this.http.post<any>(`${this.baseUrl}/interview-results`,formData);
  }
}
