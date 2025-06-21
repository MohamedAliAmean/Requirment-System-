import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    this.errorMessage = null;
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          console.log('Login successful', response);
          // Redirect to a dashboard or home page after successful login
          this.router.navigate(['/']); 
        },
        error: (error) => {
          console.error('Login failed', error);
          if (error.error && error.error.errors) {
            // Laravel validation errors
            this.errorMessage = Object.values(error.error.errors).flat().join('<br>');
          } else if (error.error && error.error.message) {
            // Custom error message from Laravel
            this.errorMessage = error.error.message;
          } else {
            this.errorMessage = 'An unexpected error occurred. Please try again.';
          }
        }
      });
    } else {
      this.errorMessage = 'Please enter your email and password.';
      this.loginForm.markAllAsTouched(); // Mark all fields as touched to display validation errors
    }
  }

  get f() { return this.loginForm.controls; }
}
