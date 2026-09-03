import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { RutinaService } from '../../services/rutina';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-crear-rutina',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './crear-rutina.html',
  styleUrl: './crear-rutina.css'
})
export class CrearRutina {

  private rutinaService = inject(RutinaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

   // Modo edición o creación
  rutinaId = signal<string | null>(null);
  esEdicion = signal(false);

  // Ejercicios seleccionados (viene del catálogo o localStorage)
  ejerciciosSeleccionados = signal<any[]>([]);

  // Formulario
  rutinaForm = new FormGroup({
    nombre: new FormControl('', [Validators.required]),
    descripcion: new FormControl(''),
    frecuencia: new FormControl('semanal'),
    diasSemana: new FormControl<string[]>([])
  });

  // Días disponibles
  dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

  error = signal('');
  exito = signal(false);
  cargando = signal(false);
  cargandoRutina = signal(false);

  mediaUrl = environment.mediaUrl;

  ngOnInit() {
    // Revisar si hay ID en la URL (modo edición)
    const id = this.route.snapshot.paramMap.get('id');

     if (id) {
      // MODO EDICIÓN: cargar rutina del backend
      this.rutinaId.set(id);
      this.esEdicion.set(true);
      this.cargarRutinaExistente(id);
    } else {
      // Modo creación: leer del localStorage
      this.esEdicion.set(false);
    // Recuperar ejercicios seleccionados (del modal o localStorage)
    const guardados = localStorage.getItem('ejerciciosRutina');
    if (guardados) {
      // Cada ejercicio nuevo viene sin series, le agregamos una por defecto
      const ejercicios = JSON.parse(guardados);
      this.ejerciciosSeleccionados.set(
          ejercicios.map((ej: any) => this.inicializarEjercicio(ej)));
    }
  }
}

 // INICIALIZAR EJERCICIO CON ESTRUCTURA COMPLETA
   inicializarEjercicio(ejercicio: any, seriesExistentes?: any[], notasExistentes?: string) {
    return {
      _id: ejercicio._id,
      nombre: ejercicio.nombre,
      gif: ejercicio.gif || ejercicio.imagen,
      imagen: ejercicio.imagen,
      categoria: ejercicio.categoria,
      musculoObjetivo: ejercicio.musculoObjetivo,
      // Si viene del backend, usa esas series. Si no, crea una por defecto
      series: seriesExistentes && seriesExistentes.length > 0 
        ? seriesExistentes.map((s: any) => ({
            numeroSerie: s.numeroSerie,
            repeticiones: s.repeticiones,
            pesoObjetivo: s.pesoObjetivo,
            descansoSegundos: s.descansoSegundos
          })): [
            { numeroSerie: 1, repeticiones: 12, pesoObjetivo: 0, descansoSegundos: 60 }
          ],
       notas: notasExistentes || '' 
    };
  }
  // CARGAR RUTINA EXISTENTE DEL BACKEND
   cargarRutinaExistente(id: string) {
    this.cargandoRutina.set(true);
    
    this.rutinaService.traerRutinaPorId(id).subscribe({
      next: (res) => {
        if (res.exitoso) {
          const rutina = res.datos;
          
          // Poblar formulario
          this.rutinaForm.patchValue({
            nombre: rutina.nombre,
            descripcion: rutina.descripcion || '',
            frecuencia: rutina.frecuencia || 'semanal',
            diasSemana: rutina.diasSemana || []
          });
          
          // Poblar ejercicios (del backend, NO del localStorage)
            const ejerciciosMapeados = rutina.ejercicios.map((e: any) => {
            const ejData = e.ejercicio || {}; // populate del backend
            return this.inicializarEjercicio(
              {
                _id: ejData._id || e.ejercicio,
                nombre: ejData.nombre || 'Ejercicio',
                gif: ejData.gif,
                imagen: ejData.imagen,
                categoria: ejData.categoria,
                musculoObjetivo: ejData.musculoObjetivo
              },
              e.series, // ← Le pasamos las series que ya tenía en la BD
              e.notas 
            );
          });
          
          this.ejerciciosSeleccionados.set(ejerciciosMapeados);
        }
      },
      error: (err) => {
        this.error.set('Error al cargar la rutina');
      },
      complete: () => {
        this.cargandoRutina.set(false);
      }
    });
  }

   // DÍAS DE LA SEMANA (toggle)
  toggleDia(dia: string) {
    const actuales = (this.rutinaForm.value.diasSemana || []) as string[];
    const index = actuales.indexOf(dia);
    
    if (index > -1) {
      actuales.splice(index, 1);
    } else {
      actuales.push(dia);
    }
    
     this.rutinaForm.patchValue({ diasSemana: [...actuales] });
  }

  // ELIMINAR EJERCICIO COMPLETO
  eliminarEjercicio(index: number) {
    const actuales = this.ejerciciosSeleccionados();
    actuales.splice(index, 1);
    this.ejerciciosSeleccionados.set([...actuales]);

   // Solo guardar en localStorage si es modo creación
    if (!this.esEdicion()) {
      localStorage.setItem('ejerciciosRutina', JSON.stringify(
       actuales.map(e => ({ _id: e._id, nombre: e.nombre, gif: e.gif, imagen: e.imagen }))
      ));
    }  
   
  }

  // AGREGAR UNA SERIE MÁS A UN EJERCICIO
  agregarSerie(ejercicioIndex: number) {
    const ejercicios = this.ejerciciosSeleccionados();
    const ejercicio = ejercicios[ejercicioIndex];
    const nuevaSerieNumero = ejercicio.series.length + 1;
    
    ejercicio.series.push({
      numeroSerie: nuevaSerieNumero,
      repeticiones: 12,
      pesoObjetivo: 0,
      descansoSegundos: 60
    });
    
    this.ejerciciosSeleccionados.set([...ejercicios]);
  }

    // ELIMINAR UNA SERIE DE UN EJERCICIO
    eliminarSerie(ejercicioIndex: number, serieIndex: number) {
    const ejercicios = this.ejerciciosSeleccionados();
    const ejercicio = ejercicios[ejercicioIndex];
    
    ejercicio.series.splice(serieIndex, 1);
    
    // Re-numerar las series para que queden 1, 2, 3...
    ejercicio.series.forEach((s: any, i: number) => {
      s.numeroSerie = i + 1;
    });
    
    this.ejerciciosSeleccionados.set([...ejercicios]);
  }

  // ACTUALIZAR UN CAMPO DE UNA SERIE
  actualizarSerie(ejercicioIndex: number, serieIndex: number, campo: string, valor: any) {
    const ejercicios = this.ejerciciosSeleccionados();
    ejercicios[ejercicioIndex].series[serieIndex][campo] = valor;
    // No hace falta signal.set porque el objeto se muta, 
    // pero si quieres reactividad estricta:
    this.ejerciciosSeleccionados.set([...ejercicios]);
  }

   // ACTUALIZAR NOTAS DE UN EJERCICIO
   actualizarNotas(ejercicioIndex: number, valor: string) {
    const ejercicios = this.ejerciciosSeleccionados();
    ejercicios[ejercicioIndex].notas = valor;
    this.ejerciciosSeleccionados.set([...ejercicios]);
  }

  // ENVIAR AL BACKEND (CREAR O ACTUALIZAR)
  onSubmit() {
    if (this.rutinaForm.invalid || this.ejerciciosSeleccionados().length === 0) {
      this.error.set('Completa el nombre y selecciona al menos un ejercicio');
      return;
    }

    this.cargando.set(true);
    this.error.set('');

    // LEER USUARIO DEL LOCALSTORAGE (tiene tipoUsuario y gymId desde el login)
    const usuarioGuardado = JSON.parse(localStorage.getItem('user') || '{}');

     // Mapear al formato exacto que espera el backend
    const datos = {
      nombre: this.rutinaForm.value.nombre,
      descripcion: this.rutinaForm.value.descripcion,
      frecuencia: this.rutinaForm.value.frecuencia,
      diasSemana: this.rutinaForm.value.diasSemana,
         // ← NUEVO: gymId solo si es usuario tipo 'gym', null si es independiente
      gymId: usuarioGuardado.tipoUsuario === 'gym' ? usuarioGuardado.gymId : null,
      ejercicios: this.ejerciciosSeleccionados().map(ej => ({
        ejercicio: ej._id,
        series: ej.series.map((s: any) => ({
          numeroSerie: s.numeroSerie,
          repeticiones: Number(s.repeticiones),
          pesoObjetivo: Number(s.pesoObjetivo),
          descansoSegundos: Number(s.descansoSegundos)
        })),
        notas: ej.notas || ''
      }))
    };

    
    if (this.esEdicion() && this.rutinaId()) {
      // ACTUALIZAR
      this.rutinaService.actualizarRutina(this.rutinaId()!, datos).subscribe({
        next: (res) => {
          if (res.exitoso) {
            this.exito.set(true);
            setTimeout(() => this.router.navigate(['/rutinas']), 1500);
          }
        },
        error: (err) => {
          this.error.set(err.error?.mensaje || 'Error al actualizar');
          this.cargando.set(false);
        },
        complete: () => {
          this.cargando.set(false);
        }
      });
    }else {
      // CREAR NUEVA
     this.rutinaService.crearRutina(datos).subscribe({
        next: (res) => {
          if (res.exitoso) {
            this.exito.set(true);
            localStorage.removeItem('ejerciciosRutina');
            setTimeout(() => this.router.navigate(['/rutinas']), 1500);
          }
        },
        error: (err) => {
          this.error.set(err.error?.mensaje || 'Error al crear rutina');
          this.cargando.set(false);
        },
        complete: () => {
          this.cargando.set(false);
        }
      });
  }
}
}