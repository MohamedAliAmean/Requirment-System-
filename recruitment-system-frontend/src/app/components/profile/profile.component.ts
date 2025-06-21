import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, UserData } from '../../services/auth.service';
import { JobApplicationService } from '../../services/job-application.service';
import { JobService } from '../../services/job.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  currentUser: UserData | null = null;
  applications: any[] = [];
  postedJobs: any[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;

  constructor(
    private authService: AuthService,
    private jobApplicationService: JobApplicationService,
    private jobService: JobService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser?.role === 'company' || this.currentUser?.role === 'job_poster') {
      this.fetchPostedJobs();
    } else {
      this.fetchApplications();
    }
  }

  fetchApplications(): void {
    this.isLoading = true;
    this.jobApplicationService.getMyApplications().subscribe({
      next: (res) => {
        this.applications = res.data || res;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load applications.';
        this.isLoading = false;
      }
    });
  }

  fetchPostedJobs(): void {
    this.isLoading = true;
    this.jobService.getMyPostedJobs().subscribe({
      next: (res) => {
        this.postedJobs = res.data || res;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load posted jobs.';
        this.isLoading = false;
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
