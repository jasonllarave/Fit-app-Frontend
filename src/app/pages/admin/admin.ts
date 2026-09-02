import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {

  private authService = inject(AuthService);

  // Datos
  usuarios = signal<any[]>([]);
  gyms = signal<any[]>([]); // Necesitarías un endpoint para esto
  cargando = signal(false);
  error = signal('');
  mensaje = signal('');

  // Filtros
  busqueda = signal('');
  filtroRol = signal<string>('');

  ngOnInit() {
    this.cargarUsuarios();
  }

  // ============================================
  // CARGAR TODOS LOS USUARIOS
  // ============================================
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

  // ============================================
  // USUARIOS FILTRADOS
  // ============================================
  usuariosFiltrados = computed(() => {
    let lista = this.usuarios();
    
    const texto = this.busqueda().toLowerCase();
    if (texto) {
      lista = lista.filter((u: any) =>
        u.nombres?.toLowerCase().includes(texto) ||
        u.apellidos?.toLowerCase().includes(texto) ||
        u.email?.toLowerCase().includes(texto)
      );
    }

    const rol = this.filtroRol();
    if (rol) {
      lista = lista.filter((u: any) => u.rol === rol);
    }

    return lista;
  });

  // ============================================
  // STATS GLOBALES
  // ============================================
  totalUsuarios = computed(() => this.usuarios().length);
  
  totalGyms = computed(() => 
    new Set(this.usuarios().filter((u: any) => u.gymId).map((u: any) => u.gymId)).size
  );

  totalAdmins = computed(() => 
    this.usuarios().filter((u: any) => u.rol === 'admin').length
  );

  totalEntrenadores = computed(() => 
    this.usuarios().filter((u: any) => u.rol === 'entrenador').length
  );

  // ============================================
  // CAMBIAR ROL
  // ============================================
  cambiarRol(userId: string, nuevoRol: string) {
    if (!confirm(`¿Cambiar rol a "${nuevoRol}"?`)) return;
    
    this.authService.actualizarRolUsuario(userId, nuevoRol).subscribe({
      next: (res) => {
        if (res.exitoso) {
          this.mensaje.set('Rol actualizado correctamente');
          this.cargarUsuarios();
          setTimeout(() => this.mensaje.set(''), 3000);
        }
      },
      error: () => {
        this.error.set('Error al cambiar rol');
      }
    });
  }

  // ============================================
  // AYUDAS
  // ============================================
  traducirRol(rol: string): string {
    const mapa: { [key: string]: string } = {
      'usuario': 'Miembro',
      'entrenador': 'Entrenador',
      'admin': 'Admin Gym',
      'superadmin': 'Super Admin'
    };
    return mapa[rol] || rol;
  }

  badgeClass(rol: string): string {
    const mapa: { [key: string]: string } = {
      'usuario': 'bg-dark border border-secondary',
      'entrenador': 'bg-dark border border-info text-info',
      'admin': 'bg-dark border border-warning text-warning',
      'superadmin': 'bg-dark border border-danger text-danger'
    };
    return mapa[rol] || 'bg-dark';
  }
}