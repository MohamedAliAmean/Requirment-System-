import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { JobService } from '../../../services/job.service';
import { Job } from '../../../models/job.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-edit-job',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-job.component.html',
  styleUrl: './edit-job.component.css'
})
export class EditJobComponent implements OnInit {
  jobId: number | null = null;
  job: Job | null = null;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  
  // Add status options for the dropdown
  statusOptions = ['active', 'closed'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private jobService: JobService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.jobId = +id; // Convert string to number
        this.loadJob();
      } else {
        this.errorMessage = 'Job ID not found in route.';
        setTimeout(() => this.router.navigate(['/job-poster/my-jobs']), 2000);
      }
    });
  }

  loadJob(): void {
    if (this.jobId) {
      this.jobService.getJobById(this.jobId).subscribe({
        next: (response) => {
          this.job = response.data;
          console.log('Loaded job for edit:', this.job);
          if (this.job) {
            console.log('Job Title (from object): ', this.job.title);
            console.log('Min Salary (from object): ', this.job.min_salary);
            console.log('Max Salary (from object): ', this.job.max_salary);
            console.log('Status (from object): ', this.job.status);
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error loading job for edit:', error);
          this.errorMessage = 'Failed to load job: ' + (error.error.message || error.statusText);
          setTimeout(() => this.errorMessage = null, 3000);
        }
      });
    }
  }

  updateJob(): void {
    if (this.job && this.jobId) {
      this.successMessage = null;
      this.errorMessage = null;

      this.jobService.updateJob(this.jobId, this.job).subscribe({
        next: (response) => {
          console.log('Job updated successfully', response);
          this.successMessage = 'Job updated successfully!';
          setTimeout(() => {
            this.successMessage = null;
            this.router.navigate(['/job-poster/my-jobs']);
          }, 2000);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error updating job', error);
          this.errorMessage = 'Failed to update job: ' + (error.error.message || error.statusText);
          setTimeout(() => this.errorMessage = null, 3000);
        }
      });
    }
  }
}
