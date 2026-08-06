import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RecompensaService } from '../../services/recompensa';

@Component({
  selector: 'app-recompensas',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './recompensas.html',
  styleUrl: './recompensas.css'
})
export class Recompensas implements OnInit { // componente con 3 estados

  private recompensaService = inject(RecompensaService);

  // Señales de estado
  recompensas = signal<any[]>([]);
  puntos = signal<any>(null);
  cargando = signal(false);
  error = signal('');

  // Usuario logueado (con tipoUsuario y gymId desde el login)
  usuario = signal<any>(JSON.parse(localStorage.getItem('user') || '{}'));

 
  // ESTADOS COMPUTADOS
  
  
  // ¿Es independiente? → Bloqueado
  esIndependiente = computed(() => this.usuario()?.tipoUsuario === 'independiente');

  // ¿Es de gym? → Puede ver recompensas (más adelante se valida si el gym las tiene activas)
  esGym = computed(() => this.usuario()?.tipoUsuario === 'gym');

  // Por ahora: bloqueado solo si es independiente
  recompensasBloqueadas = computed(() => this.esIndependiente());

  ngOnInit() {
    if (!this.recompensasBloqueadas()) {
      this.cargarRecompensas();
      this.cargarPuntos();
    }
  }

  cargarRecompensas() {
    this.cargando.set(true);
    
    this.recompensaService.traerRecompensas().subscribe({
      next: (res) => {
        if (res.exitoso) {
          this.recompensas.set(res.datos);
          this.error.set('');
        }
      },
      error: (err) => {
        this.error.set(err.error?.mensaje || 'Error al cargar recompensas');
      },
      complete: () => {
        this.cargando.set(false);
      }
    });
  }

  cargarPuntos() {
    this.recompensaService.misPuntos().subscribe({
      next: (res) => {
        if (res.exitoso) {
          this.puntos.set(res.datos);
        }
      }
    });
  }

  canjear(recompensaId: string, puntosNecesarios: number) {
    const saldo = this.puntos()?.saldo || 0;
    
    if (saldo < puntosNecesarios) {
      this.error.set(`Saldo insuficiente. Tienes ${saldo} puntos.`);
      return;
    }

    if (!confirm(`¿Canjear esta recompensa por ${puntosNecesarios} puntos?`)) return;

    this.recompensaService.canjearRecompensa(recompensaId).subscribe({
      next: (res) => {
        if (res.exitoso) {
          this.cargarPuntos();
          alert('¡Canje exitoso! 🎉');
        }
      },
      error: (err) => {
        this.error.set(err.error?.mensaje || 'Error al canjear');
      }
    });
  }
}