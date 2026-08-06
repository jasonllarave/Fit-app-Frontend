import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { SesionService } from '../../services/sesion';
import { RecompensaService } from '../../services/recompensa';

// ============================================
// ESTADO DE CADA SERIE (vive solo en el frontend mientras entrenás)
// ============================================
interface EstadoSerie {
  numeroSerie: number;
  estado: 'pendiente' | 'ejecucion' | 'descanso' | 'completada';
  pesoObjetivo: number;
  repsObjetivo: number;
  repsReales: number;                 //pide el valor de repeticiones que hizo no las precargadas
  descansoValor: number;              // número que el usuario escribe
  descansoUnidad: 'min' | 'seg';      // unidad elegida en el desplegable
  segundosEjecucion: number;          // sube mientras está en ejecución
  segundosDescansoRestante: number;   // baja mientras está en descanso
}

@Component({
  selector: 'app-entrenamiento',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './entrenamiento.html',
  styleUrl: './entrenamiento.css'
})
export class Entrenamiento implements OnInit, OnDestroy {

  private sesionService = inject(SesionService);
  private recompensaService = inject(RecompensaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  sesion = signal<any>(null);
  cargando = signal(false);
  error = signal('');

  // ============================================
  // CRONÓMETRO GENERAL DE LA SESIÓN
  // ============================================
  segundosTranscurridos = signal(0);
  private intervalId: any;

  readonly MINIMO_POR_DEFECTO_SEGUNDOS = 15 * 60;
  segundosMinimosSesion = signal(this.MINIMO_POR_DEFECTO_SEGUNDOS);
  puedeCompletar = signal(false);
  alarmaActiva = signal(false); // true = se cumplió el mínimo, se congela el reloj

  // ============================================
  // ESTADO POR SERIE: estadosSeries[ejIndex] = EstadoSerie[]
  // ============================================
  estadosSeries = signal<EstadoSerie[][]>([]);

  ngOnInit() {
    const sesionId = this.route.snapshot.paramMap.get('id');
    if (sesionId) {
      this.cargarSesion(sesionId);
    }
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  cargarSesion(id: string) {
    this.cargando.set(true);
    this.sesionService.traerSesionPorId(id).subscribe({
      next: (res) => {
        if (res.exitoso) {
          this.sesion.set(res.datos);
          this.inicializarEstadosSeries();
          this.iniciarCronometro();
        }
      },
      error: (err) => {
        this.error.set('Error al cargar sesión');
      },
      complete: () => {
        this.cargando.set(false);
      }
    });
  }

  // ============================================
  // CREAR EL ESTADO INICIAL DE CADA SERIE
  // (peso, reps y descanso salen de la rutina original)
  // ============================================
  inicializarEstadosSeries() {
  const sesion = this.sesion();
  const estados: EstadoSerie[][] = sesion.ejercicios.map((ej: any, ejIndex: number) => {
    return ej.series.map((serieGuardada: any, sIndex: number) => {
      const serieRutina = sesion.rutina?.ejercicios?.[ejIndex]?.series?.[sIndex];
      const descansoSegDefault = serieRutina?.descansoSegundos ?? 60;
      const esMultiploMin = descansoSegDefault >= 60 && descansoSegDefault % 60 === 0;

      
      const pesoGuardado = serieGuardada.pesoReal > 0 ? serieGuardada.pesoReal : (serieRutina?.pesoObjetivo ?? 0);
      const repsGuardadas = serieGuardada.repeticionesRealizadas > 0 ? serieGuardada.repeticionesRealizadas : (serieRutina?.repeticiones ?? 12);

      // Si quedó en 'descanso', al volver la tratamos como 'ejecucion' porque no
      // guardamos el tiempo exacto restante y es más seguro no dejarlo descansando solo
      const estadoGuardado = serieGuardada.estado ?? 'pendiente';

      return {
        numeroSerie: serieGuardada.numeroSerie,
         estado: estadoGuardado,
        pesoObjetivo: pesoGuardado,
        repsObjetivo: repsGuardadas,
        repsReales: serieGuardada.repeticionesRealizadas ?? repsGuardadas, 
        descansoValor: esMultiploMin ? descansoSegDefault / 60 : descansoSegDefault,
        descansoUnidad: esMultiploMin ? 'min' : 'seg',
        segundosEjecucion: serieGuardada.segundosEjecucion ?? 0,
        segundosDescansoRestante: serieGuardada.segundosDescansoRestante ?? 0
      } as EstadoSerie;
    });
  });
  this.estadosSeries.set(estados);

  // Restaurar cronómetro y mínimo guardados
  this.segundosTranscurridos.set(sesion.segundosTranscurridos ?? 0);
  const minimoGuardado = sesion.segundosMinimo ?? this.MINIMO_POR_DEFECTO_SEGUNDOS;
  this.segundosMinimosSesion.set(minimoGuardado);
  if (this.segundosTranscurridos() >= minimoGuardado) {
    this.puedeCompletar.set(true);
    this.alarmaActiva.set(true);
  }
}

  // ============================================
  // CONVERTIR descansoValor + descansoUnidad → segundos
  // ============================================
  private calcularSegundosDescanso(est: EstadoSerie): number {
    return est.descansoUnidad === 'min' ? est.descansoValor * 60 : est.descansoValor;
  }

  // ============================================
  // CRONÓMETRO CENTRAL (un solo interval para todo)
  // ============================================
 iniciarCronometro() {
  let contadorAutosave = 0;

  this.intervalId = setInterval(() => {

    // 1. Cronómetro general de la sesión (se congela si ya sonó la alarma)
    if (!this.alarmaActiva()) {
      this.segundosTranscurridos.update(s => s + 1);
      if (this.segundosTranscurridos() >= this.segundosMinimosSesion()) {
        this.puedeCompletar.set(true);
        this.alarmaActiva.set(true);
      }
    }

    // 2. Series activas
    const estados = this.estadosSeries();
    let huboCambios = false;

    estados.forEach(ejercicioEstados => {
      ejercicioEstados.forEach(est => {
        if (est.estado === 'ejecucion') {
          est.segundosEjecucion++;
          huboCambios = true;
        } else if (est.estado === 'descanso' && est.segundosDescansoRestante > 0) {
          est.segundosDescansoRestante--;
          huboCambios = true;
        }
      });
    });

    if (huboCambios) {
      this.estadosSeries.set([...estados]);
    }

    // 3. Autosave cada 20 segundos
    contadorAutosave++;
    if (contadorAutosave >= 5) {
      contadorAutosave = 0;
      this.guardarProgreso();
    }

  }, 1000);
  
}

  formatearTiempo(segundos: number): string {
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);
    const s = segundos % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // ============================================
  // SUBIR / BAJAR EL MÍNIMO DE LA SESIÓN
  // ============================================
  subirMinimoSesion(minutos: number) {
    this.segundosMinimosSesion.update(s => s + minutos * 60);
    // Si ya se había congelado, revisamos si hay que descongelar
    if (this.segundosTranscurridos() < this.segundosMinimosSesion()) {
      this.alarmaActiva.set(false);
      this.puedeCompletar.set(false);
    }
    this.guardarProgreso();
  }

  puedeBajarMinimo(): boolean {
    return this.segundosMinimosSesion() > this.MINIMO_POR_DEFECTO_SEGUNDOS;
  }

  bajarMinimoSesion(minutos: number) {
    if (!this.puedeBajarMinimo()) return;
    const nuevoMinimo = Math.max(
      this.MINIMO_POR_DEFECTO_SEGUNDOS,
      this.segundosMinimosSesion() - minutos * 60
    );
    this.segundosMinimosSesion.set(nuevoMinimo);

    if (this.segundosTranscurridos() >= nuevoMinimo) {
      this.puedeCompletar.set(true);
      this.alarmaActiva.set(true);
    }
     this.guardarProgreso();
  }

verSesion() {
  console.log('CLICK detectado');
  const el = document.getElementById('finalizar-card');
  console.log('Elemento encontrado:', el);
  if (el) {
    const rect = el.getBoundingClientRect();
    console.log('Posición en pantalla:', rect.top, 'Alto de ventana:', window.innerHeight);
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

  // ============================================
  // EDITAR CAMPOS MIENTRAS ESTÁ 'pendiente'
  // ============================================
  actualizarPeso(ejIndex: number, sIndex: number, valor: string) {
    const estados = this.estadosSeries();
    estados[ejIndex][sIndex].pesoObjetivo = Number(valor) || 0;
    this.estadosSeries.set([...estados]);
  }

  actualizarReps(ejIndex: number, sIndex: number, valor: string) {
    const estados = this.estadosSeries();
    estados[ejIndex][sIndex].repsObjetivo = Number(valor) || 0;
    this.estadosSeries.set([...estados]);
  }

  actualizarDescansoValor(ejIndex: number, sIndex: number, valor: string) {
    const estados = this.estadosSeries();
    estados[ejIndex][sIndex].descansoValor = Number(valor) || 0;
    this.estadosSeries.set([...estados]);
  }

  actualizarDescansoUnidad(ejIndex: number, sIndex: number, unidad: 'min' | 'seg') {
    const estados = this.estadosSeries();
    estados[ejIndex][sIndex].descansoUnidad = unidad;
    this.estadosSeries.set([...estados]);
  }

  // ============================================
  // TRANSICIONES DE ESTADO DE LA SERIE
  // ============================================
  iniciarEjecucion(ejIndex: number, sIndex: number) {
    const estados = this.estadosSeries();
    const est = estados[ejIndex][sIndex];
    if (est.estado !== 'pendiente') return;
    est.estado = 'ejecucion';
    this.estadosSeries.set([...estados]);
    this.guardarProgreso();
  }

  terminarEjecucion(ejIndex: number, sIndex: number) {
    const estados = this.estadosSeries();
    const est = estados[ejIndex][sIndex];
    if (est.estado !== 'ejecucion') return;
    est.segundosDescansoRestante = this.calcularSegundosDescanso(est);
    est.repsReales = est.repsObjetivo;
    est.estado = 'descanso';
    this.estadosSeries.set([...estados]);
  }

  //metodo para editar repeticiones reales
  actualizarRepsReales(ejIndex: number, sIndex: number, valor: string) {
  const estados = this.estadosSeries();
  estados[ejIndex][sIndex].repsReales = Number(valor) || 0;
  this.estadosSeries.set([...estados]);
}


  // Volver a ejecución sumando al tiempo que ya llevaba (no resetea)
  reanudarEjecucion(ejIndex: number, sIndex: number) {
    const estados = this.estadosSeries();
    const est = estados[ejIndex][sIndex];
    if (est.estado !== 'descanso') return;
    est.segundosDescansoRestante = 0;
    est.estado = 'ejecucion';
    this.estadosSeries.set([...estados]);
  }

  terminarSerie(ejIndex: number, sIndex: number) {
    const estados = this.estadosSeries();
    const est = estados[ejIndex][sIndex];
    if (est.estado !== 'descanso') return;
    est.estado = 'completada';
    this.estadosSeries.set([...estados]);
    this.guardarProgreso();  
  }

  // ============================================
  // AGREGAR UNA SERIE NUEVA A UN EJERCICIO
  // ============================================
  agregarSerie(ejIndex: number) {
    const estados = this.estadosSeries();
    const seriesEjercicio = estados[ejIndex];
    const ultima = seriesEjercicio[seriesEjercicio.length - 1];

    seriesEjercicio.push({
      numeroSerie: seriesEjercicio.length + 1,
      estado: 'pendiente',
      pesoObjetivo: ultima?.pesoObjetivo ?? 0,
      repsObjetivo: ultima?.repsObjetivo ?? 12,
      repsReales: ultima?.repsObjetivo ?? 12, 
      descansoValor: ultima?.descansoValor ?? 1,
      descansoUnidad: ultima?.descansoUnidad ?? 'min',
      segundosEjecucion: 0,
      segundosDescansoRestante: 0
    });

    this.estadosSeries.set([...estados]);
  }

  // ============================================
  // ESTADO GENERAL DE UN EJERCICIO (para el badge del header)
  // ============================================
  ejercicioCompletado(ejIndex: number): boolean {
    const series = this.estadosSeries()[ejIndex];
    return !!series?.length && series.every(s => s.estado === 'completada');
  }

  ejercicioEnProgreso(ejIndex: number): boolean {
    const series = this.estadosSeries()[ejIndex];
    if (!series) return false;
    const algunaActiva = series.some(s => s.estado === 'ejecucion' || s.estado === 'descanso');
    const algunaCompletada = series.some(s => s.estado === 'completada');
    return algunaActiva || (algunaCompletada && !this.ejercicioCompletado(ejIndex));
  }

  // ============================================
  // FINALIZAR ENTRENAMIENTO (ANTI-TRAMPA)
  // ============================================
  finalizarEntrenamiento(sensacion: string) {
    if (!this.puedeCompletar()) {
      const faltan = this.segundosMinimosSesion() - this.segundosTranscurridos();
      const minutos = Math.ceil(faltan / 60);
      this.error.set(`Anti-trampa: debes entrenar el tiempo mínimo. Faltan ${minutos} minutos.`);
      return;
    }

    const sesionId = this.sesion()?._id;
    if (!sesionId) return;

    const duracionMinutos = Math.floor(this.segundosTranscurridos() / 60);
    const estados = this.estadosSeries();

    const algunaCompletada = estados.some(ej => ej.some(s => s.estado === 'completada'));
    if (!algunaCompletada) {
      this.error.set('Debes completar al menos una serie para finalizar.');
      return;
    }

    const ejerciciosFinal = this.sesion().ejercicios.map((ej: any, ejIndex: number) => ({
      ejercicio: ej.ejercicio?._id || ej.ejercicio,
      series: estados[ejIndex].map((est) => ({
        numeroSerie: est.numeroSerie,
        repeticionesRealizadas: est.repsReales,
        pesoReal: est.pesoObjetivo,
        completada: est.estado === 'completada',
        estado: est.estado  
      }))
    }));

    const datos = {
      duracionMinutos,
      sensacion,
      completada: true,
      ejercicios: ejerciciosFinal
    };

    this.sesionService.actualizarSesion(sesionId, datos).subscribe({
      next: (res) => {
        if (res.exitoso) {
          this.ganarPuntos(duracionMinutos);
        }
      },
      error: (err) => {
        this.error.set(err.error?.mensaje || 'Error al finalizar');
      }
    });
  }


// ============================================
// GUARDAR PROGRESO (autosave)
// ============================================
guardarProgreso() {
  const sesionId = this.sesion()?._id;
  if (!sesionId) return;

  const estados = this.estadosSeries();
  const ejerciciosProgreso = this.sesion().ejercicios.map((ej: any, ejIndex: number) => ({
    ejercicio: ej.ejercicio?._id || ej.ejercicio,
    series: estados[ejIndex].map((est) => ({
      numeroSerie: est.numeroSerie,
      repeticionesRealizadas: est.repsReales,
      pesoReal: est.pesoObjetivo,
      completada: est.estado === 'completada',
      estado: est.estado,
      segundosEjecucion: est.segundosEjecucion,   
      segundosDescansoRestante: est.segundosDescansoRestante 
    }))
  }));

  this.sesionService.actualizarSesion(sesionId, {
    ejercicios: ejerciciosProgreso,
    segundosTranscurridos: this.segundosTranscurridos(),
    segundosMinimo: this.segundosMinimosSesion(),
    duracionMinutos: Math.floor(this.segundosTranscurridos() / 60)
  }).subscribe();
}

  // ============================================
  // GANAR PUNTOS AUTOMÁTICAMENTE
  // ============================================
  ganarPuntos(duracionMinutos: number) {
    const puntos = 10 + Math.floor(duracionMinutos / 5);

    this.recompensaService.ganarPuntos({
      cantidad: puntos,
      motivo: `Sesión completada: ${duracionMinutos} minutos`,
      sesion: this.sesion()?._id
    }).subscribe({
      next: () => {
        this.router.navigate(['/sesiones'], {
          queryParams: { exito: 'Sesión completada', puntos }
        });
      },
      error: () => {
        this.router.navigate(['/sesiones']);
      }
    });
  }
}