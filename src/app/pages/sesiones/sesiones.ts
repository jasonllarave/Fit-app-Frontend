import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { SesionService } from '../../services/sesion';

@Component({
  selector: 'app-sesiones',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sesiones.html',
  styleUrl: './sesiones.css'
})
export class Sesiones implements OnInit {

  private sesionService = inject(SesionService);
  private route = inject(ActivatedRoute);

  sesionSeleccionada = signal<any>(null);
  sesiones = signal<any[]>([]);
  sesionesEnCurso = signal<any[]>([]);
  cargando = signal(false);
  error = signal('');

  // Banner de éxito al volver desde entrenamiento.ts
  mensajeExito = signal('');
  puntosGanados = signal(0);

  //Señales para agrupar por semana sesiones terminadas
  semanasExpandidas = signal<Set<string>>(new Set());
  semanaFiltro = signal('');
  paginaPorSemana = signal<{ [key: string]: number }>({});
  readonly ITEMS_POR_PAGINA = 6;

  //Resumen de ejercicio dentro de cada semana
  resumenSemanaSeleccionada = signal<any>(null);

  ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    if (params.get('exito')) {
      this.mensajeExito.set(params.get('exito') || '');
      this.puntosGanados.set(Number(params.get('puntos') || 0));
    }
    this.cargarSesiones();
  }

  cargarSesiones() {
    this.cargando.set(true);

    this.sesionService.traerSesiones().subscribe({
      next: (res) => {
        if (res.exitoso) {
          const completadas = res.datos
            .filter((s: any) => s.completada)
            .sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
          this.sesiones.set(completadas);

          const enCurso = res.datos
            .filter((s: any) => !s.completada)
            .sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
          this.sesionesEnCurso.set(enCurso);
        }
      },
      error: (err) => {
        this.error.set(err.error?.mensaje || 'Error al cargar sesiones');
      },
      complete: () => {
        this.cargando.set(false);
      }
    });
  }

  descartarSesion(id: string) {
    if (!confirm('¿Descartar este entrenamiento sin terminar?')) return;

    this.sesionService.eliminarSesion(id).subscribe({
      next: () => {
        this.sesionesEnCurso.set(this.sesionesEnCurso().filter((s: any) => s._id !== id));
      },
      error: (err) => {
        this.error.set(err.error?.mensaje || 'Error al descartar');
      }
    });
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  iconoSensacion(sensacion: string): string {
  const iconos: { [key: string]: string } = {
    'muy dificil': 'bi-4-circle',
    'dificil': 'bi-3-circle',
    'normal': 'bi-2-circle',
    'facil': 'bi-1-circle',
    'muy facil': 'bi-0-circle'
  };
  return iconos[sensacion] || 'bi-question-circle';
}

  abrirDetalle(s: any) {
  this.sesionSeleccionada.set(s);
}

cerrarDetalle() {
  this.sesionSeleccionada.set(null);
}

formatearTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

iconoEstado(estado: string): string {
  const iconos: { [key: string]: string } = {

    'completada': ' bi-check-square', 'ejecucion': 'bi-caret-right-square', 'descanso': 'bi-compass-fill', 'pendiente': 'bi-cone-striped'
  };
  return iconos[estado] || '❓';
}




// Devuelve el lunes de la semana de una fecha, como clave 'YYYY-MM-DD'
private obtenerClaveSemana(fechaStr: string): string {
  const fecha = new Date(fechaStr);
  const dia = fecha.getDay(); // 0=domingo, 1=lunes...
  const diferencia = dia === 0 ? -6 : 1 - dia; // retrocede hasta el lunes
  const lunes = new Date(fecha);
  lunes.setDate(fecha.getDate() + diferencia);
  lunes.setHours(0, 0, 0, 0);
  return lunes.toISOString().split('T')[0]; // 'YYYY-MM-DD'
}

private etiquetaSemana(claveLunes: string): string {
  const lunes = new Date(claveLunes + 'T00:00:00');
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);

  const opciones: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
  const inicio = lunes.toLocaleDateString('es-CO', opciones);
  const fin = domingo.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

  const hoy = new Date();
  const claveHoy = this.obtenerClaveSemana(hoy.toISOString());
  if (claveLunes === claveHoy) return `Esta semana (${inicio} - ${fin})`;

  return `${inicio} - ${fin}`;
}


// AGRUPACIÓN POR SEMANA
// Computed: agrupa sesiones() completadas por semana
semanasAgrupadas = computed(() => {
  const sesiones = this.sesiones();
  const filtro = this.semanaFiltro();
  const grupos = new Map<string, any[]>();

  for (const s of sesiones) {
    const clave = this.obtenerClaveSemana(s.fecha);
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave)!.push(s);
  }

  let claves = Array.from(grupos.keys()).sort((a, b) => b.localeCompare(a)); // más reciente primero

  if (filtro) {
    claves = claves.filter(c => c === filtro);
  }

  return claves.map(clave => ({
    clave,
    etiqueta: this.etiquetaSemana(clave),
    sesiones: grupos.get(clave)!,
    cantidad: grupos.get(clave)!.length
  }));
});

// Lista de semanas disponibles para el filtro dropdown
opcionesSemanas = computed(() => {
  return this.semanasAgrupadas().length
    ? Array.from(new Set(this.sesiones().map(s => this.obtenerClaveSemana(s.fecha))))
        .sort((a, b) => b.localeCompare(a))
        .map(clave => ({ clave, etiqueta: this.etiquetaSemana(clave) }))
    : [];
});

toggleSemana(clave: string) {
  const set = new Set(this.semanasExpandidas());
  if (set.has(clave)) {
    set.delete(clave);
  } else {
    set.add(clave);
  }
  this.semanasExpandidas.set(set);
}

semanaAbierta(clave: string): boolean {
  return this.semanasExpandidas().has(clave);
}

// Paginación por semana
sesionesPaginadas(clave: string, todas: any[]): any[] {
  const pagina = this.paginaPorSemana()[clave] ?? 1;
  const inicio = (pagina - 1) * this.ITEMS_POR_PAGINA;
  return todas.slice(inicio, inicio + this.ITEMS_POR_PAGINA);
}

totalPaginas(cantidad: number): number {
  return Math.ceil(cantidad / this.ITEMS_POR_PAGINA);
}

paginaActual(clave: string): number {
  return this.paginaPorSemana()[clave] ?? 1;
}

cambiarPagina(clave: string, delta: number) {
  const actual = this.paginaActual(clave);
  this.paginaPorSemana.update(p => ({ ...p, [clave]: actual + delta }));
}

filtrarPorSemana(clave: string) {
  this.semanaFiltro.set(this.semanaFiltro() === clave ? '' : clave);
}




//resumen agregado por ejercicio
abrirResumenSemana(grupo: any) {
  const mapa = new Map<string, any>();

  grupo.sesiones.forEach((s: any) => {
    const fechaCorta = new Date(s.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });

    s.ejercicios.forEach((ej: any) => {
      const id = ej.ejercicio?._id || ej.ejercicio;
      if (!mapa.has(id)) {
        mapa.set(id, {
          ejercicio: ej.ejercicio,
          dias: new Set<string>(),
          totalSeries: 0,
          totalReps: 0,
          totalPesoAcumulado: 0,   // suma de peso*reps de cada serie (volumen total)
          totalSegundosEjecucion: 0
        });
      }

      const entry = mapa.get(id);
      let ejercicioTuvoAlgunaSerieCompletada = false;

      ej.series.forEach((serie: any) => {
        if (serie.estado === 'completada' || serie.completada) {
          entry.totalSeries++;
          entry.totalReps += serie.repeticionesRealizadas || 0;
          entry.totalPesoAcumulado += (serie.pesoReal || 0) * (serie.repeticionesRealizadas || 0);
          entry.totalSegundosEjecucion += serie.segundosEjecucion || 0;
          ejercicioTuvoAlgunaSerieCompletada = true;
        }
      });

      if (ejercicioTuvoAlgunaSerieCompletada) {
        entry.dias.add(fechaCorta);
      }
    });
  });

  const resumen = Array.from(mapa.values())
    .map(e => ({ ...e, dias: Array.from(e.dias) }))
    .filter(e => e.totalSeries > 0); // solo ejercicios con al menos algo completado

  this.resumenSemanaSeleccionada.set({
    etiqueta: grupo.etiqueta,
    ejercicios: resumen
  });
}

cerrarResumenSemana() {
  this.resumenSemanaSeleccionada.set(null);
}

formatearDuracionLarga(segundos: number): string {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}






}