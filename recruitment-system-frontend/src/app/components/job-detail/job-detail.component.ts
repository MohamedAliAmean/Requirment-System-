import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { JobService } from '../../services/job.service';
import { Job } from '../../models/job.model';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './job-detail.component.html',
  styleUrl: './job-detail.component.css'
})
export class JobDetailComponent implements OnInit, OnDestroy {
  job: Job | undefined;
  errorMessage: string | null = null;
  applicationForm!: FormGroup;
  selectedFile: File | null = null;
  applicationSuccessMessage: string | null = null;
  applicationErrorMessage: string | null = null;
  isLoggedIn: boolean = false;
  isApplicant: boolean = false;
  private userSubscription: Subscription | undefined;

  constructor(
    private route: ActivatedRoute,
    private jobService: JobService,
    private fb: FormBuilder,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.initApplicationForm();
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.isApplicant = user?.role === 'applicant';
    });

    this.route.paramMap.subscribe(params => {
      const jobId = params.get('id');
      if (jobId) {
        this.fetchJobDetails(Number(jobId));
      }
    });
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }

  initApplicationForm(): void {
    this.applicationForm = this.fb.group({
      cover_letter: [''],
      cv_file: [null, Validators.required]
    });
  }

  onFileSelected(event: any): void {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
      this.applicationForm.patchValue({
        cv_file: this.selectedFile
      });
      this.applicationForm.get('cv_file')?.updateValueAndValidity();
    }
  }

  onApplySubmit(): void {
    this.applicationSuccessMessage = null;
    this.applicationErrorMessage = null;

    if (this.applicationForm.invalid) {
      this.applicationErrorMessage = 'Please select a CV file.';
      this.applicationForm.markAllAsTouched();
      return;
    }

    if (!this.job) {
      this.applicationErrorMessage = 'Job details not loaded. Cannot apply.';
      return;
    }

    const formData = new FormData();
    formData.append('cover_letter', this.applicationForm.get('cover_letter')?.value || '');
    if (this.selectedFile) {
      formData.append('cv_file', this.selectedFile, this.selectedFile.name);
    }

    this.jobService.applyForJob(this.job.id, formData).subscribe({
      next: (response) => {
        console.log('Application successful', response);
        this.applicationSuccessMessage = 'Your application has been submitted successfully!';
        this.applicationForm.reset();
        this.selectedFile = null;
        // Optionally update job applicants count if needed from response or re-fetch job
      },
      error: (error) => {
        console.error('Application failed', error);
        if (error.error && error.error.errors) {
          this.applicationErrorMessage = Object.values(error.error.errors).flat().join('<br>');
        } else if (error.error && error.error.message) {
          this.applicationErrorMessage = error.error.message;
        } else {
          this.applicationErrorMessage = 'An unexpected error occurred during application. Please try again.';
        }
      }
    });
  }

  fetchJobDetails(id: number): void {
    this.jobService.getJobById(id).subscribe({
      next: (response) => {
        this.job = response.data;
      },
      error: (error) => {
        console.error('Failed to fetch job details', error);
        this.errorMessage = 'Failed to load job details. Please try again later.';
      }
    });
  }
}
