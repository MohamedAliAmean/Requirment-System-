import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', Validators.required],
      phone_number: ['', Validators.required],
      role: ['applicant', Validators.required],
      company_type: [null],
      company_name: [null]
    }, { validators: this.passwordMatchValidator });

    this.onRoleChanges();
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('password')?.value === form.get('password_confirmation')?.value
      ? null : { 'mismatch': true };
  }

  onRoleChanges(): void {
    this.registerForm.get('role')?.valueChanges.subscribe(role => {
      const companyTypeControl = this.registerForm.get('company_type');
      const companyNameControl = this.registerForm.get('company_name');

      if (role === 'company') {
        companyTypeControl?.setValidators(Validators.required);
        companyNameControl?.setValidators(Validators.required);
      } else if (role === 'job_poster') {
        companyTypeControl?.clearValidators();
        companyNameControl?.setValidators(Validators.required);
      } else {
        companyTypeControl?.clearValidators();
        companyNameControl?.clearValidators();
      }
      companyTypeControl?.updateValueAndValidity();
      companyNameControl?.updateValueAndValidity();
    });
  }

  onSubmit(): void {
    this.errorMessage = null;
    if (this.registerForm.valid) {
      this.authService.register(this.registerForm.value).subscribe({
        next: (response) => {
          console.log('Registration successful', response);
          this.router.navigate(['/login']); // Redirect to login page
        },
        error: (error) => {
          console.error('Registration failed', error);
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
      this.errorMessage = 'Please fill in all required fields and correct any errors.';
      this.registerForm.markAllAsTouched(); // Mark all fields as touched to display validation errors
    }
  }

  get f() { return this.registerForm.controls; }
}
