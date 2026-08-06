import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {

  private authService = inject(AuthService);

  usuarios = signal<any[]>([]);
  cargando = signal(false);
  error = signal('');
  mensaje = signal('');

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.cargando.set(true);
    this.authService.traerTodosUsuarios().subscribe({
      next: (res) => {
        if (res.exitoso) {
          this.usuarios.set(res.datos);
        }
      },
      error: () => {
        this.error.set('Error al cargar usuarios');
      },
      complete: () => {
        this.cargando.set(false);
      }
    });
  }

  cambiarRol(userId: string, nuevoRol: string) {
    if (!confirm(`¿Cambiar rol a ${nuevoRol}?`)) return;
    
    this.authService.actualizarRolUsuario(userId, nuevoRol).subscribe({
      next: (res) => {
        if (res.exitoso) {
          this.mensaje.set('Rol actualizado');
          this.cargarUsuarios();
          setTimeout(() => this.mensaje.set(''), 3000);
        }
      },
      error: () => {
        this.error.set('Error al cambiar rol');
      }
    });
  }

  traducirRol(rol: string): string {
    const roles: { [key: string]: string } = {
      'usuario': 'Miembro',
      'entrenador': 'Entrenador',
      'admin': 'Admin Gym',
      'superadmin': 'Super Admin'
    };
    return roles[rol] || rol;
  }

  badgeClass(rol: string): string {
    const clases: { [key: string]: string } = {
      'usuario': 'bg-secondary',
      'entrenador': 'bg-dark border border-light',
      'admin': 'bg-dark border border-warning text-warning',
      'superadmin': 'bg-dark border border-danger text-danger'
    };
    return clases[rol] || 'bg-dark';
  }
}