import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { JobService } from '../../../services/job.service';
import { Job } from '../../../models/job.model'; // Assuming you have a Job model
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-list-job',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './list-job.component.html',
  styleUrl: './list-job.component.css'
})
export class ListJobComponent implements OnInit {
  jobs: Job[] = [];
  errorMessage: string | null = null;
  currentUser: any = null;
  isLoading: boolean = true;

  constructor(
    private jobService: JobService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadUserJobs();
  }

  loadUserJobs(): void {
    this.isLoading = true;
    this.errorMessage = null;

    // Get current user for debugging
    this.currentUser = this.authService.getCurrentUser();

    // Check if we have a token

    if (!this.currentUser) {
      this.errorMessage = 'You must be logged in to view your jobs';
      this.isLoading = false;
      return;
    }

    this.jobService.getMyPostedJobs().subscribe({
      next: (response) => {
        console.log('ListJobComponent - Received jobs response:', response);
        this.jobs = response.data;
        this.errorMessage = null;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('ListJobComponent - Error fetching jobs:', error);
        console.error('ListJobComponent - Error status:', error.status);
        console.error('ListJobComponent - Error message:', error.message);
        console.error('ListJobComponent - Error response:', error.error);
        
        if (error.status === 403) {
          this.errorMessage = 'You are not authorized to view posted jobs.';
        } else {
          this.errorMessage = 'Failed to load your jobs. Please try again later.';
        }
        this.isLoading = false;
      }
    });
  }
}
