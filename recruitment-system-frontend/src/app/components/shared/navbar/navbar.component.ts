import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { Subscription } from 'rxjs';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLoggedIn: boolean = false;
  userRole: string | null = null;
  currentUser: any = null;
  mobileMenuOpen: boolean = false;
  isDarkMode: boolean = false;
  private userSubscription: Subscription | undefined;

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.userRole = user ? user.role : null;
      this.currentUser = user;
    });
    this.loadTheme();
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.mobileMenuOpen = false;
        this.router.navigate(['/login']);
      },
      error: (error) => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        this.mobileMenuOpen = false;
        this.router.navigate(['/login']);
      }
    });
  }

  toggleTheme(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.isDarkMode = !this.isDarkMode;
    this.applyTheme();
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    console.log('Theme toggled:', this.isDarkMode, 'HTML classes:', document.documentElement.className);
  }

  loadTheme(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      this.isDarkMode = true;
    } else {
      this.isDarkMode = false;
    }
    this.applyTheme();
  }

  applyTheme(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const html = document.documentElement;
    if (this.isDarkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }
}
