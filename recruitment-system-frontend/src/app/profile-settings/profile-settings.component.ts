import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService, UserData } from '../services/auth.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-settings.component.html',
  styleUrl: './profile-settings.component.css'
})
export class ProfileSettingsComponent implements OnInit, OnDestroy {
  profileForm!: FormGroup;
  currentUser: UserData | null = null;
  profilePictureFile: File | null = null;
  backgroundImageFile: File | null = null;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  private userSubscription: Subscription | undefined;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser$.subscribe((user: UserData | null) => {
      this.currentUser = user;
      this.initForm();
    });
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }

  initForm(): void {
    this.profileForm = this.fb.group({
      name: [this.currentUser?.name || '', Validators.required],
      bio: [this.currentUser?.bio || ''],
      profile_picture: [null],
      background_image: [null]
    });
  }

  onProfilePictureSelected(event: any): void {
    if (event.target.files.length > 0) {
      this.profilePictureFile = event.target.files[0];
    }
  }

  onBackgroundImageSelected(event: any): void {
    if (event.target.files.length > 0) {
      this.backgroundImageFile = event.target.files[0];
    }
  }

  onSubmit(): void {
    this.successMessage = null;
    this.errorMessage = null;

    if (this.profileForm.invalid) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    const formData = new FormData();
    formData.append('name', this.profileForm.get('name')?.value);
    formData.append('bio', this.profileForm.get('bio')?.value || '');

    if (this.profilePictureFile) {
      formData.append('profile_picture', this.profilePictureFile, this.profilePictureFile.name);
    }
    if (this.backgroundImageFile) {
      formData.append('background_image', this.backgroundImageFile, this.backgroundImageFile.name);
    }

    this.authService.updateUserProfile(formData).subscribe({
      next: (response: any) => {
        this.successMessage = response.message;
        this.profilePictureFile = null;
        this.backgroundImageFile = null;
        this.profileForm.get('profile_picture')?.reset();
        this.profileForm.get('background_image')?.reset();

        setTimeout(() => {
          this.router.navigate(['/profile']);
        }, 2000);
      },
      error: (error: any) => {
        console.error('Profile update failed', error);
        if (error.error && error.error.errors) {
          this.errorMessage = Object.values(error.error.errors).flat().join('<br>');
        } else if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'An unexpected error occurred during profile update. Please try again.';
        }
      }
    });
  }
}
