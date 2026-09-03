import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { RutinaService } from '../../services/rutina';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-rutinas',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './rutinas.html',
  styleUrl: './rutinas.css'
})
export class Rutinas {

  private rutinaService = inject(RutinaService);
   private router = inject(Router); 

  rutinas = signal<any[]>([]);
  cargando = signal(false);
  error = signal('');
  diaFiltro = signal('');

  mediaUrl = environment.mediaUrl;

  dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

  // Computed: filtra por día automáticamente
  rutinasFiltradas = computed(() => {
    const dia = this.diaFiltro();
    const lista = this.rutinas();
    
    if (!dia) return lista;
    
    return lista.filter((r: any) => r.diasSemana?.includes(dia));
  });

  ngOnInit() {
    this.cargarRutinas();
  }

  cargarRutinas() {
    this.cargando.set(true);
    
    this.rutinaService.traerRutinas().subscribe({
      next: (res) => {
        if (res.exitoso) {
          this.rutinas.set(res.datos);
          this.error.set('');
        }
      },
      error: (err) => {
        this.error.set(err.error?.mensaje || 'Error al cargar rutinas');
      },
      complete: () => {
        this.cargando.set(false);
      }
    });
  }

  filtrarPorDia(dia: string) {
    // Si ya está seleccionado, lo quita (toggle)
    if (this.diaFiltro() === dia) {
      this.diaFiltro.set('');
    } else {
      this.diaFiltro.set(dia);
    }
  }

  // ← NUEVO: Lleva al catálogo pasando el ID de la rutina para agregar ejercicios
  agregarEjercicios(rutinaId: string) {
    this.router.navigate(['/ejercicios'], { 
      queryParams: { editarRutina: rutinaId } 
    });
  }

  eliminarRutina(id: string) {
    if (!confirm('¿Eliminar esta rutina permanentemente?')) return;
    
    this.rutinaService.eliminarRutina(id).subscribe({
      next: (res) => {
        if (res.exitoso) {
          // Quitar de la lista local
          this.rutinas.set(this.rutinas().filter((r: any) => r._id !== id));
        }
      },
      error: (err) => {
        this.error.set(err.error?.mensaje || 'Error al eliminar');
      }
    });
  }
   // DESACTIVAR RUTINA (soft delete)
   desactivarRutina(id: string) {
    if (!confirm('¿Desactivar esta rutina? Podrás reactivarla luego.')) return;
    
    this.rutinaService.desactivarRutina(id).subscribe({
      next: (res) => {
        if (res.exitoso) {
          // Actualizar localmente sin recargar
          this.rutinas.set(this.rutinas().map((r: any) => 
            r._id === id ? { ...r, activa: false } : r
          ));
        }
      },
      error: (err) => {
        this.error.set(err.error?.mensaje || 'Error al desactivar');
      }
    });
  }

   // ACTIVAR RUTINA
   activarRutina(id: string) {
    this.rutinaService.actualizarRutina(id, { activa: true }).subscribe({
      next: (res) => {
        if (res.exitoso) {
          this.rutinas.set(this.rutinas().map((r: any) => 
            r._id === id ? { ...r, activa: true } : r
          ));
        }
      },
      error: (err) => {
        this.error.set(err.error?.mensaje || 'Error al activar');
      }
    });
  }

  traducirDia(dia: string): string {
    const dias: { [key: string]: string } = {
      'lunes': 'Lun', 'martes': 'Mar', 'miercoles': 'Mié',
      'jueves': 'Jue', 'viernes': 'Vie', 'sabado': 'Sáb', 'domingo': 'Dom'
    };
    return dias[dia] || dia;
  }
}