import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { JobDetailComponent } from './components/job-detail/job-detail.component';
import { JobPosterDashboardComponent } from './components/job-poster/job-poster-dashboard/job-poster-dashboard.component';
import { CreateJobComponent } from './components/job-poster/create-job/create-job.component';
import { ListJobComponent } from './components/job-poster/list-job/list-job.component';
import { ShowApplicationsComponent } from './components/job-poster/show-applications/show-applications.component';
import { EditJobComponent } from './components/job-poster/edit-job/edit-job.component';
import { authGuard } from './guards/auth.guard';
import { ProfileSettingsComponent } from './profile-settings/profile-settings.component';
import { MyApplicationsComponent } from './my-applications/my-applications.component';
import { AllJobsComponent } from './components/all-jobs/all-jobs.component';
import { ProfileComponent } from './components/profile/profile.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'forgot-password', component: ForgotPasswordComponent },
    { path: 'reset-password', component: ResetPasswordComponent },
    { path: 'profile-settings', component: ProfileSettingsComponent, canActivate: [authGuard] },
    { path: 'jobs/:id', component: JobDetailComponent },
    { path: 'my-applications', component: MyApplicationsComponent, canActivate: [authGuard] },
    { path: 'jobs', component: AllJobsComponent },
    {
        path: 'job-poster',
        canActivate: [authGuard],
        children: [
            { path: 'dashboard', component: JobPosterDashboardComponent },
            { path: 'create-job', component: CreateJobComponent },
            { path: 'my-jobs', component: ListJobComponent },
            { path: 'applications', component: ShowApplicationsComponent },
            { path: 'applications/:id', component: ShowApplicationsComponent },
            { path: 'edit-job/:id', component: EditJobComponent },
        ]
    },
    { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
    { path: '**', redirectTo: '' } // Redirect to home for any other unknown routes
];
