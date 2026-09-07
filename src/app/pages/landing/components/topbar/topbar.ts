import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../services/auth';

@Component({
  selector: 'app-landing-topbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css'
})
export class LandingTopbar {
  private auth = inject(AuthService);
  isLogged = () => this.auth.isLogged();
  irDashboard = () => this.auth.redirigirSegunRol();
}
