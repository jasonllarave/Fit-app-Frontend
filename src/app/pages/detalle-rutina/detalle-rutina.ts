import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { RutinaService } from '../../services/rutina';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-detalle-rutina',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './detalle-rutina.html',
  styleUrl: './detalle-rutina.css'
})
export class DetalleRutina implements OnInit {

  private rutinaService = inject(RutinaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  rutina = signal<any>(null);
  cargando = signal(false);
  error = signal('');

  mediaUrl = environment.mediaUrl;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarRutina(id);
    } else {
      this.router.navigate(['/rutinas']);
    }
  }

  cargarRutina(id: string) {
    this.cargando.set(true);
    
    this.rutinaService.traerRutinaPorId(id).subscribe({
      next: (res) => {
        if (res.exitoso) {
          this.rutina.set(res.datos);
          this.error.set('');
        }
      },
      error: (err) => {
        this.error.set(err.error?.mensaje || 'Error al cargar rutina');
      },
      complete: () => {
        this.cargando.set(false);
      }
    });
  }

  toggleActiva() {
    const r = this.rutina();
    if (!r) return;
    
    if (r.activa) {
      // Desactivar
      this.rutinaService.desactivarRutina(r._id).subscribe({
        next: (res) => {
          if (res.exitoso) {
            this.rutina.set({ ...r, activa: false });
          }
        }
      });
    } else {
      // Reactivar (usamos actualizarRutina con activa: true)
      this.rutinaService.actualizarRutina(r._id, { activa: true }).subscribe({
        next: (res) => {
          if (res.exitoso) {
            this.rutina.set({ ...r, activa: true });
          }
        }
      });
    }
  }

  traducirDia(dia: string): string {
    const dias: { [key: string]: string } = {
      'lunes': 'Lunes', 'martes': 'Martes', 'miercoles': 'Miércoles',
      'jueves': 'Jueves', 'viernes': 'Viernes', 'sabado': 'Sábado', 'domingo': 'Domingo'
    };
    return dias[dia] || dia;
  }
}