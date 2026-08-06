import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { RecompensaService } from '../../services/recompensa';

@Component({
  selector: 'app-admin-gym',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-gym.html',
  styleUrl: './admin-gym.css'
})
export class AdminGym implements OnInit {

  private authService = inject(AuthService);
  private recompensaService = inject(RecompensaService);

  usuario = signal<any>(this.authService.getUser());
  usuariosGym = signal<any[]>([]);
  recompensas = signal<any[]>([]);
  cargando = signal(false);
  error = signal('');

  ngOnInit() {
    this.cargarUsuariosGym();
    this.cargarRecompensas();
  }

  cargarUsuariosGym() {
    this.cargando.set(true);
    this.authService.traerUsuariosGym().subscribe({
      next: (res) => {
        if (res.exitoso) {
          this.usuariosGym.set(res.datos);
        }
      },
      error: () => {
        this.error.set('Error al cargar usuarios del gym');
      },
      complete: () => {
        this.cargando.set(false);
      }
    });
  }

  cargarRecompensas() {
    this.recompensaService.traerRecompensas().subscribe({
      next: (res) => {
        if (res.exitoso) {
          this.recompensas.set(res.datos);
        }
      }
    });
  }

  toggleRecompensa(id: string, activa: boolean) {
    // Implementar según tu backend
  }
}