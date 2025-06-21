import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-job-poster-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './job-poster-dashboard.component.html',
  styleUrl: './job-poster-dashboard.component.css'
})
export class JobPosterDashboardComponent {

}
