import { Component, signal, inject } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  private authService = inject(AuthService);
  private router = inject(Router);

  errorMessage = signal('');

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)])
  });

  onLogin() {
    if (this.loginForm.invalid) return;

    const email = this.loginForm.value.email!;
    const password = this.loginForm.value.password!;

    this.authService.login(email, password).subscribe({
      next: (res) => {
        if (res.exitoso) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.usuario)); //JSON.stringify convierte objeto → string para guardar en localStorage.
          this.authService.redirigirSegunRol();
          this.errorMessage.set(''); // limpia error si habia, errorMessage() tiene texto de error
          // Después de guardar el usuario en localStorage
          const user = res.usuario || res.datos;
          // Redirigir según rol
          if (user.rol === 'superadmin') {
            this.router.navigate(['/admin']);
          } else if (user.rol === 'admin') {
            this.router.navigate(['/admin-gym']);
          } else {
            this.router.navigate(['/dashboard']);
          }
          
        }
      },
      error: (err) => {
        this.errorMessage.set(err.error?.mensaje || 'Error al iniciar sesion');
      }
    });
  }
}


