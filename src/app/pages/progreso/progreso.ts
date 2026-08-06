import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { SesionService } from '../../services/sesion';
import { RecompensaService } from '../../services/recompensa';

@Component({
  selector: 'app-progreso',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progreso.html',
  styleUrl: './progreso.css'
})
export class Progreso implements OnInit {

  private sesionService = inject(SesionService);
  private recompensaService = inject(RecompensaService);

  sesiones = signal<any[]>([]);
  puntos = signal<any>(null);
  cargando = signal(false);
  error = signal('');
  ejercicioSeleccionado = signal<string>('');

    // Para usar Math en el template
  Math = Math;

  ngOnInit() {
    this.cargarSesiones();
    this.cargarPuntos();
  }

  cargarSesiones() {
    this.cargando.set(true);
    this.sesionService.traerSesiones().subscribe({
      next: (res) => {
        if (res.exitoso) {
          const completadas = res.datos
            .filter((s: any) => s.completada)
            .sort((a: any, b: any) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
          this.sesiones.set(completadas);
        }
      },
      error: (err) => {
        this.error.set(err.error?.mensaje || 'Error al cargar progreso');
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

  // ============================================
  // MÉTRICAS RESUMEN
  // ============================================
  totalSesiones = computed(() => this.sesiones().length);

  promedioDuracion = computed(() => {
    const s = this.sesiones();
    if (s.length === 0) return 0;
    const total = s.reduce((acc, x) => acc + (x.duracionMinutos || 0), 0);
    return Math.round(total / s.length);
  });

  // Racha: días consecutivos (hasta hoy o ayer) con al menos una sesión completada
  racha = computed(() => {
    const s = this.sesiones();
    if (s.length === 0) return 0;

    const diasConSesion = new Set(
      s.map(x => new Date(x.fecha).toISOString().split('T')[0])
    );

    let racha = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    // Si hoy no entrenó, empieza a contar desde ayer (no rompe la racha por no haber entrenado hoy todavía)
    const hoyStr = cursor.toISOString().split('T')[0];
    if (!diasConSesion.has(hoyStr)) {
      cursor.setDate(cursor.getDate() - 1);
    }

    while (diasConSesion.has(cursor.toISOString().split('T')[0])) {
      racha++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return racha;
  });

  // ============================================
  // VOLUMEN SEMANAL (últimas 8 semanas)
  // ============================================
  private obtenerClaveSemana(fechaStr: string): string {
    const fecha = new Date(fechaStr);
    const dia = fecha.getDay();
    const diferencia = dia === 0 ? -6 : 1 - dia;
    const lunes = new Date(fecha);
    lunes.setDate(fecha.getDate() + diferencia);
    lunes.setHours(0, 0, 0, 0);
    return lunes.toISOString().split('T')[0];
  }

  volumenSemanal = computed(() => {
    const grupos = new Map<string, number>();

    this.sesiones().forEach(s => {
      const clave = this.obtenerClaveSemana(s.fecha);
      let volumenSesion = 0;
      s.ejercicios?.forEach((ej: any) => {
        ej.series?.forEach((serie: any) => {
          if (serie.estado === 'completada' || serie.completada) {
            volumenSesion += (serie.pesoReal || 0) * (serie.repeticionesRealizadas || 0);
          }
        });
      });
      grupos.set(clave, (grupos.get(clave) || 0) + volumenSesion);
    });

    const claves = Array.from(grupos.keys()).sort().slice(-8); // últimas 8 semanas
    const maxVolumen = Math.max(...claves.map(c => grupos.get(c) || 0), 1);

    return claves.map(clave => {
      const lunes = new Date(clave + 'T00:00:00');
      return {
        etiqueta: lunes.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
        volumen: grupos.get(clave) || 0,
        porcentaje: Math.round(((grupos.get(clave) || 0) / maxVolumen) * 100)
      };
    });
  });

  // ============================================
  // EVOLUCIÓN POR EJERCICIO
  // ============================================
  listaEjercicios = computed(() => {
    const mapa = new Map<string, any>();
    this.sesiones().forEach(s => {
      s.ejercicios?.forEach((ej: any) => {
        const id = ej.ejercicio?._id || ej.ejercicio;
        if (id && !mapa.has(id)) {
          mapa.set(id, ej.ejercicio);
        }
      });
    });
    return Array.from(mapa.values());
  });

  seleccionarEjercicio(id: string) {
    this.ejercicioSeleccionado.set(id);
  }

  evolucionEjercicio = computed(() => {
    const id = this.ejercicioSeleccionado();
    if (!id) return [];

    const puntos: { fecha: string; pesoMax: number }[] = [];

    this.sesiones().forEach(s => {
      const ej = s.ejercicios?.find((e: any) => (e.ejercicio?._id || e.ejercicio) === id);
      if (!ej) return;

      let pesoMax = 0;
      ej.series?.forEach((serie: any) => {
        if ((serie.estado === 'completada' || serie.completada) && (serie.pesoReal || 0) > pesoMax) {
          pesoMax = serie.pesoReal;
        }
      });

      if (pesoMax > 0) {
        puntos.push({
          fecha: new Date(s.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
          pesoMax
        });
      }
    });

    const maxGlobal = Math.max(...puntos.map(p => p.pesoMax), 1);
    return puntos.map(p => ({ ...p, porcentaje: Math.round((p.pesoMax / maxGlobal) * 100) }));
  });


    // ============================================
  // MODAL DE LEYENDA PARA CARDS DE RESUMEN
  // ============================================
  leyendaActiva = signal<{ icono: string; titulo: string; descripcion: string; formula: string } | null>(null);

    abrirLeyenda(tipo: 'puntos' | 'racha' | 'sesiones' | 'promedio') {
    const leyendas = {
      puntos: {
        icono: 'bi-clipboard-heart',
        titulo: 'Puntos totales',
        descripcion: 'Cada vez que completás una sesión de entrenamiento ganás puntos automáticamente. Estos puntos los podés canjear por recompensas en tu gimnasio (si sos usuario gym).',
        formula: '10 puntos base + 1 punto extra por cada 5 minutos de entrenamiento.\nEj: 30 min = 10 + 6 = 16 puntos.'
      },
      racha: {
        icono: 'bi-bullseye',
        titulo: 'Días de racha',
        descripcion: 'Es la cantidad de días consecutivos que entrenaste sin saltear uno. Si entrenás lunes, martes y miércoles, tu racha es de 3 días. Si descansás jueves, la racha se rompe y vuelve a 0.',
        formula: 'Se cuenta desde hoy (o ayer si aún no entrenaste) hacia atrás hasta encontrar un día sin sesión completada.'
      },
      sesiones: {
        icono: 'bi-clipboard2-pulse',
        titulo: 'Sesiones completadas',
        descripcion: 'Son los entrenamientos que iniciaste desde una rutina, completaste al menos una serie, y duraron más de 15 minutos (anti-trampa). Las sesiones canceladas o vacías no cuentan.',
        formula: 'Solo sesiones con completada: true y duración ≥ 15 minutos.'
      },
      promedio: {
        icono: 'bi-clock-history',
        titulo: 'Duración promedio',
        descripcion: 'El tiempo promedio que duran tus entrenamientos. Te ayuda a ver si estás siendo consistente con la duración de tus sesiones.',
        formula: 'Suma de minutos de todas las sesiones ÷ cantidad de sesiones.\nEj: (45 + 30 + 60) ÷ 3 = 45 min promedio.'
      }
    };

    this.leyendaActiva.set(leyendas[tipo]);
  }

  cerrarLeyenda() {
    this.leyendaActiva.set(null);
  }
}