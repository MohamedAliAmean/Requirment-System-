import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JobApplicationService } from '../services/job-application.service';
import { AuthService } from '../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-applications.component.html',
  styleUrl: './my-applications.component.css'
})
export class MyApplicationsComponent implements OnInit {
  applications: any[] = [];
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading: boolean = true;
  selectedApplication: any = null;
  showDetailsModal: boolean = false;

  constructor(
    private jobApplicationService: JobApplicationService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadMyApplications();
  }

  loadMyApplications(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.jobApplicationService.getMyApplications().subscribe({
      next: (response) => {
        console.log('My applications response:', response);

        // Handle both direct array and wrapped data responses
        if (Array.isArray(response)) {
          this.applications = response;
        } else if (response && Array.isArray(response.data)) {
          this.applications = response.data;
        } else {
          this.applications = [];
          console.error('Unexpected response format:', response);
        }

        this.isLoading = false;
        console.log('Applications loaded:', this.applications);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading applications:', error);
        this.errorMessage = 'Failed to load applications: ' + (error.error?.message || error.statusText || 'Unknown error');
        this.isLoading = false;
        this.applications = [];
      }
    });
  }

  viewApplicationDetails(application: any): void {
    this.selectedApplication = application;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedApplication = null;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return '⏳';
      case 'reviewed': return '👁️';
      case 'accepted': return '✅';
      case 'rejected': return '❌';
      default: return '❓';
    }
  }

  getStatusMessage(status: string): string {
    switch (status) {
      case 'pending': return 'Your application is under review';
      case 'reviewed': return 'Your application has been reviewed';
      case 'accepted': return 'Congratulations! Your application has been accepted';
      case 'rejected': return 'Your application was not selected for this position';
      default: return 'Unknown status';
    }
  }
}
