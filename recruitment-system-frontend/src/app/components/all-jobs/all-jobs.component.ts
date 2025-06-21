import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JobService } from '../../services/job.service';
import { AuthService, UserData } from '../../services/auth.service';
import { JobApplicationService } from '../../services/job-application.service';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-all-jobs',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './all-jobs.component.html',
  styleUrl: './all-jobs.component.css'
})
export class AllJobsComponent implements OnInit {
  jobs: any[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;
  currentUser: UserData | null = null;
  appliedJobIds: Set<number> = new Set();

  // Modal/form state
  showApplyModal: boolean = false;
  selectedJob: any = null;
  cvFile: File | null = null;
  coverLetter: string = '';
  applyError: string | null = null;
  applySuccess: string | null = null;
  isApplying: boolean = false;

  constructor(
    private jobService: JobService,
    private authService: AuthService,
    private jobApplicationService: JobApplicationService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.fetchJobs();
    this.fetchMyApplications();
  }

  fetchJobs(): void {
    this.isLoading = true;
    this.jobService.getJobs().subscribe({
      next: (res) => {
        this.jobs = res.data || res;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load jobs.';
        this.isLoading = false;
      }
    });
  }

  fetchMyApplications(): void {
    if (this.currentUser?.role !== 'applicant') return;
    this.jobApplicationService.getMyApplications().subscribe({
      next: (res) => {
        const applications = res.data || res;
        this.appliedJobIds = new Set(applications.map((app: any) => app.job_id));
      },
      error: () => {
        // Ignore error, just don't block UI
      }
    });
  }

  canApply(jobId: number): boolean {
    return this.currentUser?.role === 'applicant' && !this.appliedJobIds.has(jobId);
  }

  openApplyModal(job: any): void {
    this.selectedJob = job;
    this.showApplyModal = true;
    this.cvFile = null;
    this.coverLetter = '';
    this.applyError = null;
    this.applySuccess = null;
  }

  closeApplyModal(): void {
    this.showApplyModal = false;
    this.selectedJob = null;
    this.cvFile = null;
    this.coverLetter = '';
    this.applyError = null;
    this.applySuccess = null;
  }

  onCvSelected(event: any): void {
    const file = event.target.files[0];
    this.cvFile = file ? file : null;
  }

  submitApplication(): void {
    if (!this.selectedJob || !this.cvFile) {
      this.applyError = 'Please select a CV file.';
      return;
    }
    this.isApplying = true;
    this.applyError = null;
    this.applySuccess = null;
    const formData = new FormData();
    formData.append('cv_file', this.cvFile);
    if (this.coverLetter) formData.append('cover_letter', this.coverLetter);
    this.jobApplicationService.applyForJob(this.selectedJob.id, formData).subscribe({
      next: () => {
        this.applySuccess = 'Application submitted successfully!';
        this.appliedJobIds.add(this.selectedJob.id);
        setTimeout(() => this.closeApplyModal(), 1500);
        this.isApplying = false;
      },
      error: (err: any) => {
        this.applyError = err.error?.message || 'Failed to submit application.';
        this.isApplying = false;
      }
    });
  }
}
