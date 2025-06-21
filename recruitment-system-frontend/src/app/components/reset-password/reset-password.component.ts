import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const passwordConfirmation = control.get('password_confirmation');

  if (password && passwordConfirmation && password.value !== passwordConfirmation.value) {
    return { passwordMismatch: true };
  }

  return null;
};

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  message: string | null = null;
  success: boolean = false;
  token: string | null = null;
  email: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.token = params.get('token');
      this.email = params.get('email');
    });
  }

  onSubmit(): void {
    if (this.resetPasswordForm.invalid || !this.token || !this.email) {
      return;
    }
    this.message = null;

    const data = {
      ...this.resetPasswordForm.value,
      token: this.token,
      email: this.email
    };

    this.authService.resetPassword(data).subscribe({
      next: (response) => {
        this.success = true;
        this.message = response.message;
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.success = false;
        this.message = err.error.message || 'An unexpected error occurred.';
      }
    });
  }
}
