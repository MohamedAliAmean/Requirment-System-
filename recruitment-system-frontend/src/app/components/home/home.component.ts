import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { JobService } from '../../services/job.service';
import { Job } from '../../models/job.model';
import { AuthService, UserData } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { Observable } from 'rxjs';
import { PostService } from '../../services/post.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  jobs: Job[] = [];
  errorMessage: string | null = null;
  isLoadingJobs: boolean = true;
  currentUser: UserData | null = null;
  private userSubscription: Subscription | undefined;
  posts: any[] = [];

  constructor(
    private jobService: JobService,
    private authService: AuthService,
    private postService: PostService
  ) { }

  ngOnInit(): void {
    // Subscribe to current user changes
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      console.log('HomeComponent - Current User:', this.currentUser);
      if (this.currentUser && this.currentUser.role === 'applicant') {
        this.loadPosts();
      } else {
      this.loadJobs(); // Call a new method to load jobs based on user role
      }
    });
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }

  loadJobs(): void {
    this.isLoadingJobs = true;
    this.errorMessage = null;

    let jobsObservable: Observable<Job[] | { data: Job[] }>;

    if (this.currentUser && (this.currentUser.role === 'company' || this.currentUser.role === 'job_poster')) {
      jobsObservable = this.jobService.getMyPostedJobs();
    } else {
      jobsObservable = this.jobService.getJobs();
    }

    jobsObservable.subscribe({
      next: (data) => {
        // Handle both Job[] and { data: Job[] } responses
        if ('data' in data) {
          this.jobs = data.data;
        } else {
          this.jobs = data;
        }
        this.isLoadingJobs = false;
        console.log('HomeComponent - Jobs Loaded:', this.jobs);
      },
      error: (error) => {
        console.error('HomeComponent - Error loading jobs:', error);
        this.errorMessage = 'Failed to load jobs. Please try again later.';
        this.isLoadingJobs = false;
      }
    });
  }

  loadPosts(): void {
    this.isLoadingJobs = true;
    this.errorMessage = null;
    this.postService.getMyPosts().subscribe({
      next: (res) => {
        this.posts = res.data || [];
        this.isLoadingJobs = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load posts. Please try again later.';
        this.isLoadingJobs = false;
      }
    });
  }
}
