import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {

  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm = new FormGroup({
    nombres: new FormControl('', [Validators.required]),
    apellidos: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    telefono: new FormControl(''),
    ciudad: new FormControl(''),
    tipoUsuario: new FormControl<'gym' | 'independiente'>('independiente', [Validators.required])
  });

  errorMessage = signal('');
  cargando = signal(false);

  onRegister() {
    if (this.registerForm.invalid) {
      this.errorMessage.set('Completa todos los campos obligatorios');
      return;
    }

    this.cargando.set(true);
    this.errorMessage.set('');

    const datos = {
      nombres: this.registerForm.value.nombres,
      apellidos: this.registerForm.value.apellidos,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      telefono: this.registerForm.value.telefono,
      ciudad: this.registerForm.value.ciudad,
      tipoUsuario: this.registerForm.value.tipoUsuario,
      rol: 'usuario'
    };

    this.authService.register(datos).subscribe({
      next: (res) => {
        if (res.exitoso) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.usuario));
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.errorMessage.set(err.error?.mensaje || 'Error al registrarse');
        this.cargando.set(false);
      },
      complete: () => {
        this.cargando.set(false);
      }
    });
  }
}