import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { RutinaService } from '../../services/rutina';
import { SesionService } from '../../services/sesion';

@Component({
  selector: 'app-iniciar-sesion',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './iniciar-sesion.html',
  styleUrl: './iniciar-sesion.css'
})
export class IniciarSesion implements OnInit {

  private rutinaService = inject(RutinaService);
  private sesionService = inject(SesionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  rutina = signal<any>(null);
  cargando = signal(false);
  error = signal('');
  bloqueado = signal(false);
  mensajeBloqueo = signal('');

  // Anti-trampa: tiempos mínimos
  readonly DURACION_MINIMA_MINUTOS = 15;      // Mínimo 15 min de entrenamiento
  readonly COOLDOWN_HORAS = 12;               // 12h entre sesiones de misma rutina

  ngOnInit() {
    const rutinaId = this.route.snapshot.paramMap.get('rutinaId');
    if (rutinaId) {
      this.verificarCooldown(rutinaId);
      this.cargarRutina(rutinaId);
    }
  }

  cargarRutina(id: string) {
    this.cargando.set(true);
    this.rutinaService.traerRutinaPorId(id).subscribe({
      next: (res) => {
        if (res.exitoso) {
          this.rutina.set(res.datos);
        }
      },
      error: (err) => {
        this.error.set('Error al cargar rutina');
      },
      complete: () => {
        this.cargando.set(false);
      }
    });
  }

  
  // ANTI-TRAMPA: Verificar cooldown
 
  verificarCooldown(rutinaId: string) {
    this.sesionService.traerSesiones().subscribe({
      next: (res) => {
        if (res.exitoso) {
          const sesiones = res.datos;
          const ahora = new Date();
          
          // Buscar última sesión completada de esta rutina
          const ultimaSesion = sesiones
            .filter((s: any) => s.rutina?._id === rutinaId && s.completada)
            .sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];

          if (ultimaSesion) {
            const fechaUltima = new Date(ultimaSesion.fecha);
            const horasDiferencia = (ahora.getTime() - fechaUltima.getTime()) / (1000 * 60 * 60);
            
            if (horasDiferencia < this.COOLDOWN_HORAS) {
              const horasRestantes = Math.ceil(this.COOLDOWN_HORAS - horasDiferencia);
              this.bloqueado.set(true);
              this.mensajeBloqueo.set(
                `Debes esperar ${horasRestantes} horas más para repetir esta rutina. Última sesión: ${fechaUltima.toLocaleString()}`
              );
            }
          }
        }
      }
    });
  }

  
  // INICIAR ENTRENAMIENTO
  
  iniciarEntrenamiento() {
    if (this.bloqueado()) return;
    
    const rutinaId = this.rutina()?._id;
    if (!rutinaId) return;

    const datos = {
      rutina: rutinaId,
      ejercicios: this.rutina().ejercicios.map((e: any) => ({
        ejercicio: e.ejercicio?._id || e.ejercicio,
        series: e.series.map((s: any) => ({
          numeroSerie: s.numeroSerie,
          repeticiones: s.repeticiones,
          pesoObjetivo: s.pesoObjetivo,
          pesoReal: 0,
          repeticionesRealizadas: 0,
          completada: false
        }))
      })),
      duracionMinutos: 0,
      completada: false
    };

    this.sesionService.crearSesion(datos).subscribe({
      next: (res) => {
        if (res.exitoso) {
          // Redirigir a la pantalla de entrenamiento en vivo
          this.router.navigate(['/entrenamiento', res.datos._id]);
        }
      },
      error: (err) => {
        this.error.set(err.error?.mensaje || 'Error al iniciar sesión de entrenamiento');
      }
    });
  }
}