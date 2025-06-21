import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient, private authService: AuthService) { }

  getJobs(): Observable<any> {
    return this.http.get(`${this.apiUrl}/jobs`);
  }

  getMyPostedJobs(): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.get(`${this.apiUrl}/my-posted-jobs`, { headers });
  }

  applyForJob(jobId: number, formData: FormData): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.post(`${this.apiUrl}/jobs/${jobId}/apply`, formData, { headers });
  }

  getJobById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/jobs/${id}`);
  }

  createJob(jobData: any): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.post(`${this.apiUrl}/jobs`, jobData, { headers });
  }

  updateJob(jobId: number, jobData: any): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.put(`${this.apiUrl}/jobs/${jobId}`, jobData, { headers });
  }
}
