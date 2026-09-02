import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { RecompensaService } from '../../services/recompensa';
import { SesionService } from '../../services/sesion';

@Component({
  selector: 'app-admin-gym',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './admin-gym.html',
  styleUrl: './admin-gym.css'
})
export class AdminGym implements OnInit {

  private authService = inject(AuthService);
  private recompensaService = inject(RecompensaService);
  private sesionService = inject(SesionService);

  // Datos del admin logueado
  admin = signal<any>(this.authService.getUser());

  // Secciones activas
  seccionActiva = signal<'clientes' | 'recompensas' | 'estadisticas'>('clientes');

  // Datos
  clientes = signal<any[]>([]);
  recompensas = signal<any[]>([]);
  sesionesGym = signal<any[]>([]);
  cargando = signal(false);
  error = signal('');

  // Filtros
  busquedaCliente = signal('');
  clienteSeleccionado = signal<any>(null);

  ngOnInit() {
    this.cargarClientes();
    this.cargarRecompensas();
    this.cargarSesionesGym();
  }

  // ============================================
  // CARGAR CLIENTES DEL GYM
  // ============================================
  cargarClientes() {
    this.cargando.set(true);
    this.authService.traerUsuariosGym().subscribe({
      next: (res) => {
        if (res.exitoso) {
          this.clientes.set(res.datos);
        }
      },
      error: () => {
        this.error.set('Error al cargar clientes del gym');
      },
      complete: () => {
        this.cargando.set(false);
      }
    });
  }

  // ============================================
  // CARGAR RECOMPENSAS DEL GYM
  // ============================================
  cargarRecompensas() {
    this.recompensaService.traerRecompensas().subscribe({
      next: (res) => {
        if (res.exitoso) {
          // Filtrar solo las de este gym (si el backend no lo hace)
          const gymId = this.admin()?.gymId;
          this.recompensas.set(
            gymId ? res.datos.filter((r: any) => r.gymId === gymId) : res.datos
          );
        }
      }
    });
  }

  // ============================================
  // CARGAR SESIONES (para estadísticas)
  // ============================================
  cargarSesionesGym() {
    this.sesionService.traerSesiones().subscribe({
      next: (res) => {
        if (res.exitoso) {
          // Filtrar sesiones de clientes de este gym
          const clientesIds = new Set(this.clientes().map(c => c._id));
          this.sesionesGym.set(
            res.datos.filter((s: any) => clientesIds.has(s.cliente))
          );
        }
      }
    });
  }

  // ============================================
  // CLIENTES FILTRADOS
  // ============================================
  clientesFiltrados = computed(() => {
    const texto = this.busquedaCliente().toLowerCase();
    if (!texto) return this.clientes();
    return this.clientes().filter((c: any) =>
      c.nombres?.toLowerCase().includes(texto) ||
      c.apellidos?.toLowerCase().includes(texto) ||
      c.email?.toLowerCase().includes(texto)
    );
  });

  // ============================================
  // STATS COMPUTADAS
  // ============================================
  totalClientes = computed(() => this.clientes().length);
  
  clientesActivosHoy = computed(() => {
    const hoy = new Date().toISOString().split('T')[0];
    return this.sesionesGym().filter((s: any) => 
      s.fecha?.startsWith(hoy) && s.completada
    ).length;
  });

  totalSesionesCompletadas = computed(() => 
    this.sesionesGym().filter((s: any) => s.completada).length
  );

  puntosRepartidos = computed(() => 
    this.clientes().reduce((acc, c) => acc + (c.puntos?.saldo || 0), 0)
  );

  // ============================================
  // VER PROGRESO DE UN CLIENTE
  // ============================================
  verCliente(cliente: any) {
    this.clienteSeleccionado.set(cliente);
    this.seccionActiva.set('estadisticas');
  }

  // ============================================
  // RECOMPENSAS: ACTIVAR/DESACTIVAR
  // ============================================
  toggleRecompensa(id: string, estado: boolean) {
    // Implementar según tu backend
    console.log('Toggle recompensa', id, estado);
  }

  // ============================================
  // VOLVER A CLIENTES
  // ============================================
  volverAClientes() {
    this.clienteSeleccionado.set(null);
    this.seccionActiva.set('clientes');
  }
}