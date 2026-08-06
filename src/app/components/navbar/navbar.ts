import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {

  private authService = inject(AuthService);
  private router = inject(Router);

  esSuperAdmin = signal(false);
  esAdmin = signal(false);

  ngOnInit() {
    // Releer el rol cada vez que se monta el navbar
    this.esSuperAdmin.set(this.authService.isSuperAdmin());
    this.esAdmin.set(this.authService.isAdmin() || this.authService.isSuperAdmin());
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}