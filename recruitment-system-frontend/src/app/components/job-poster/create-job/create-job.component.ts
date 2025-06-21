import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JobService } from '../../../services/job.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-create-job',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-job.component.html',
  styleUrl: './create-job.component.css'
})
export class CreateJobComponent implements OnInit {
  job = { title: '', description: '', min_salary: 0, max_salary: 0, requirements: '' };
  successMessage: string | null = null;
  errorMessage: string | null = null;
  currentUser: any = null;

  constructor(
    private jobService: JobService, 
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.errorMessage = 'You must be logged in to create a job';
      setTimeout(() => this.router.navigate(['/login']), 2000);
    }
  }

  createJob(): void {
    this.successMessage = null;
    this.errorMessage = null;

    // Add the company name from the current user
    const jobData = {
      ...this.job,
      company_name: this.currentUser.company_name
    };

    this.jobService.createJob(jobData).subscribe({
      next: (response) => {
        console.log('Job created successfully', response);
        this.successMessage = 'Job created successfully!';
        // Clear form
        this.job = { title: '', description: '', min_salary: 0, max_salary: 0, requirements: '' };
        // Navigate to the list of jobs
        setTimeout(() => {
          this.successMessage = null;
          this.router.navigate(['/job-poster/my-jobs']);
        }, 2000);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error creating job', error);
        this.errorMessage = 'Failed to create job: ' + (error.error.message || error.statusText);
        setTimeout(() => this.errorMessage = null, 3000);
      }
    });
  }
}
