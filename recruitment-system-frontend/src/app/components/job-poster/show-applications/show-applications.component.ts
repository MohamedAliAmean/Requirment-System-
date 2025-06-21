import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { JobApplicationService } from '../../../services/job-application.service';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-show-applications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './show-applications.component.html',
  styleUrl: './show-applications.component.css'
})
export class ShowApplicationsComponent implements OnInit {
  jobId: number | null = null;
  applications: any[] = [];
  errorMessage: string | null = null;
  successMessage: string | null = null;
  selectedApplication: any = null;
  showDetailsModal: boolean = false;
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private jobApplicationService: JobApplicationService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      this.jobId = idParam ? Number(idParam) : null;
      if (this.jobId) {
        this.fetchApplicationsForJob();
      } else {
        this.fetchApplicationsForAllJobs();
      }
    });
  }

  fetchApplicationsForJob(): void {
    if (!this.jobId) return;
    this.isLoading = true;
    this.jobApplicationService.getApplicationsForJob(this.jobId).subscribe({
      next: (response) => {
        if (response && Array.isArray(response.data)) {
          this.applications = response.data;
          this.errorMessage = null;
        } else {
          this.applications = [];
          this.errorMessage = 'Failed to load applications. Unexpected data format from server.';
        }
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.applications = [];
        this.errorMessage = 'Failed to load applications: ' + (error.error?.message || error.statusText || 'Unknown error');
        this.isLoading = false;
      }
    });
  }

  fetchApplicationsForAllJobs(): void {
    this.isLoading = true;
    this.jobApplicationService.getApplicationsForMyJobs().subscribe({
      next: (response) => {
        if (response && Array.isArray(response.data)) {
          this.applications = response.data;
          this.errorMessage = null;
        } else {
          this.applications = [];
          this.errorMessage = 'Failed to load applications. Unexpected data format from server.';
        }
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.applications = [];
        this.errorMessage = 'Failed to load applications: ' + (error.error?.message || error.statusText || 'Unknown error');
        this.isLoading = false;
      }
    });
  }

  updateStatus(applicationId: number, newStatus: string): void {
    this.jobApplicationService.updateApplicationStatus(applicationId, newStatus).subscribe({
      next: (response) => {
        console.log('Application status updated', response);
        this.successMessage = `Application status updated to ${newStatus}.`;

        // Update the status in the local array
        const index = this.applications.findIndex(app => app.id === applicationId);
        if (index !== -1) {
          this.applications[index].status = newStatus;
        }

        // Trigger notification for the applicant
        if (response.job_title && response.applicant_name) {
          this.notificationService.addApplicationStatusNotification(
            applicationId,
            response.job_title,
            newStatus
          );
        }

        setTimeout(() => this.successMessage = null, 3000); // Clear message after 3 seconds
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error updating status', error);
        this.errorMessage = 'Failed to update status: ' + (error.error.message || error.statusText);
        setTimeout(() => this.errorMessage = null, 3000); // Clear message after 3 seconds
      }
    });
  }

  downloadCv(applicationId: number, applicantName: string): void {
    this.jobApplicationService.downloadCv(applicationId).subscribe({
      next: (data: Blob) => {
        const blob = new Blob([data], { type: 'application/pdf' }); // Assuming CVs are PDFs
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${applicantName}_CV.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.successMessage = `CV for ${applicantName} downloaded successfully.`;
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error downloading CV', error);
        this.errorMessage = 'Failed to download CV: ' + (error.error.message || error.statusText);
        setTimeout(() => this.errorMessage = null, 3000);
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
      case 'pending': return 'Application is under review';
      case 'reviewed': return 'Application has been reviewed';
      case 'accepted': return 'Application has been accepted';
      case 'rejected': return 'Application was not selected';
      default: return 'Unknown status';
    }
  }

  getApplicationsByStatus(status: string): any[] {
    return this.applications.filter(app => app.status === status);
  }
}
