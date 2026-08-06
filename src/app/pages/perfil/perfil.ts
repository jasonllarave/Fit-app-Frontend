import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { RutinaService } from '../../services/rutina';
import { RecompensaService } from '../../services/recompensa';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil implements OnInit {

  private authService = inject(AuthService);
  private rutinaService = inject(RutinaService);
  private recompensaService = inject(RecompensaService);
  private router = inject(Router);

  // Datos del usuario
  usuario = signal<any>(JSON.parse(localStorage.getItem('user') || '{}'));
  perfilCompleto = signal<any>(null);

  // Métricas
  rutinas = signal<any[]>([]);
  puntos = signal<any>(null);
  cargando = signal(false);
  guardando = signal(false);
  error = signal('');
  mensajeExito = signal('');

  // Modo edición
  editando = signal(false);

  // Formulario de edición
  perfilForm = new FormGroup({
    nombres: new FormControl('', [Validators.required, Validators.minLength(4)]),
    apellidos: new FormControl('', [Validators.required, Validators.minLength(4)]),
    telefono: new FormControl(''),
    ciudad: new FormControl('')
  });

  ngOnInit() {
    this.cargarPerfil();
    this.cargarMetricas();
  }

 
  // CARGAR PERFIL COMPLETO DEL BACKEND
 
  cargarPerfil() {
    this.cargando.set(true);
    const user = this.usuario();

    this.authService.traerPerfil().subscribe({
      next: (res) => {
        if (res.exitoso) {
          this.perfilCompleto.set(res.datos);
          this.error.set('');

          // Poblar formulario
          this.perfilForm.patchValue({
            nombres: res.datos.nombres || '',
            apellidos: res.datos.apellidos || '',
            telefono: res.datos.telefono || '',
            ciudad: res.datos.ciudad || ''
          });
        }
      },
      error: (err) => {
        this.error.set(err.error?.mensaje || 'Error al cargar perfil');
      },
      complete: () => {
        this.cargando.set(false);
      }
    });
  }

 
  // CARGAR MÉTRICAS PERSONALES
  
  cargarMetricas() {
    // Rutinas
    this.rutinaService.traerRutinas().subscribe({
      next: (res) => {
        if (res.exitoso) {
          this.rutinas.set(res.datos);
        }
      }
    });

    // Puntos
    this.recompensaService.misPuntos().subscribe({
      next: (res) => {
        if (res.exitoso) {
          this.puntos.set(res.datos);
        }
      }
    });
  }

  
  // GUARDAR CAMBIOS DEL PERFIL
  
  guardarCambios() {
    if (this.perfilForm.invalid) {
      this.error.set('Completa los campos obligatorios');
      return;
    }

    this.guardando.set(true);
    this.error.set('');
    this.mensajeExito.set('');

    const datos = {
      nombres: this.perfilForm.value.nombres,
      apellidos: this.perfilForm.value.apellidos,
      telefono: this.perfilForm.value.telefono,
      ciudad: this.perfilForm.value.ciudad
    };

    this.authService.actualizarPerfil(datos).subscribe({
      next: (res) => {
        if (res.exitoso) {
          this.perfilCompleto.set(res.datos);
          this.mensajeExito.set('Perfil actualizado correctamente');

          // Actualizar localStorage con el nombre nuevo
          const userActual = this.usuario();
          userActual.nombre = res.datos.nombres;
          localStorage.setItem('user', JSON.stringify(userActual));
          this.usuario.set(userActual);

          this.editando.set(false);
        }
      },
      error: (err) => {
        this.error.set(err.error?.mensaje || 'Error al actualizar');
      },
      complete: () => {
        this.guardando.set(false);
      }
    });
  }

 
  // CERRAR SESIÓN
  
  logout() {
    if (!confirm('¿Cerrar sesión?')) return;
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  
  // CANCELAR EDICIÓN
 
  cancelarEdicion() {
    this.editando.set(false);
    this.error.set('');
    // Restaurar valores originales
    const p = this.perfilCompleto();
    if (p) {
      this.perfilForm.patchValue({
        nombres: p.nombres || '',
        apellidos: p.apellidos || '',
        telefono: p.telefono || '',
        ciudad: p.ciudad || ''
      });
    }
  }

 
  // AYUDAS VISUALES
 
  tipoUsuarioLabel(): string {
    const t = this.perfilCompleto()?.tipoUsuario;
    if (t === 'gym') return ' Usuario de Gimnasio';
    if (t === 'independiente') return ' Entrenador Independiente';
    return 'Usuario';
  }

  rolLabel(): string {
    const r = this.perfilCompleto()?.rol;
    const labels: { [key: string]: string } = {
      'usuario': 'Miembro',
      'entrenador': 'Entrenador',
      'admin': 'Administrador',
      'superadmin': 'Super Admin'
    };
    return labels[r] || r;
  }

  fechaRegistroFormateada(): string {
    const f = this.perfilCompleto()?.fechaRegistro || this.perfilCompleto()?.createdAt;
    if (!f) return 'No disponible';
    return new Date(f).toLocaleDateString('es-CO', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }
}