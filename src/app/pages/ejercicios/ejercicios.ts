import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

import { FiltrosSidebar } from '../../components/filtros-sidebar/filtros-sidebar';

//Servicios
import { EjercicioService } from '../../services/ejercicio';
import { RutinaService } from '../../services/rutina';

@Component({
  selector: 'app-ejercicios',
  standalone: true,
  imports: [CommonModule, FiltrosSidebar],
  templateUrl: './ejercicios.html',
  styleUrl: './ejercicios.css',
})
export class Ejercicios implements OnInit {

  // PASO 2: INYECTAR SERVICIOS (estilo inject())
 private ejercicioService = inject(EjercicioService);
 private rutinaService = inject(RutinaService);
 private router = inject(Router);
 private route = inject(ActivatedRoute);
 

 // PASO 3: SEÑALES DE ESTADO


  // Señales (igual que login)
  
    // Lista de ejercicios que muestra el grid
  ejercicios = signal<any[]>([]);
  // Opciones para los selects de filtros
  categorias = signal<string[]>([]);
  equipos = signal<string[]>([]);
  musculos = signal<string[]>([]);

  // Señal para filtros activos sidebar-filtros
  filtrosActivos = signal<{ categoria: string; equipo: string; musculo: string }>({
    categoria: '', equipo: '', musculo: ''
    });

  // Búsqueda por texto
  busqueda = signal('');

  // Estados de carga y error
  cargando = signal(false);
  error = signal('');

   // Filtro activo
  categoriaSeleccionada = signal('');

  // Modal
  // Señales nuevas
  ejercicioSeleccionado = signal<any>(null);
  mostrarModal = signal(false);

  // ← NUEVO: Si estamos agregando a una rutina YA CREADA, acá guardamos su ID
  // Si es null, estamos creando una rutina nueva
  //  detectar si viene de editar:
  rutinaEnEdicion = signal<string | null>(null);

  //  PASO 4: Diccionario de traducciones (aquí va)
  nombresLegibles: { [key: string]: string } = {
    'back': 'Espalda',
    'cardio': 'Cardio',
    'chest': 'Pecho',
    'lower arms': 'Antebrazos',
    'lower legs': 'Piernas Inferiores',
    'neck': 'Cuello',
    'shoulders': 'Hombros',
    'upper arms': 'Brazos Superiores',
    'upper legs': 'Piernas Superiores',
    'waist': 'Cintura',
    'dumbbell': 'Mancuernas',
    'barbell': 'Barra',
    'body weight': 'Peso Corporal',
    'cable': 'Cable',
    'kettlebell': 'Pesa Rusa',
    'smith machine': 'Máquina Smith',
    'leverage machine': 'Máquina de Palanca',
    'stability ball': 'Balón de Estabilidad',
    'medicine ball': 'Balón Medicinal',
    'resistance band': 'Banda de Resistencia',
    'assisted': 'Asistido',
    'band': 'Banda',
    'bosu ball': 'Bosu',
    'elliptical machine': 'Elíptica',
    'ez barbell': 'Barra EZ',
    'hammer': 'Martillo',
    'olympic barbell': 'Barra Olímpica',
    'roller': 'Rodillo',
    'rope': 'Cuerda',
    'skierg machine': 'Skierg',
    'sled machine': 'Trineo',
    'stationary bike': 'Bicicleta Estática',
    'stepmill machine': 'Stepmill',
    'tire': 'Llanta',
    'trap bar': 'Barra Hexagonal',
    'upper body ergometer': 'Ergómetro Superior',
    'weighted': 'Con Peso',
    'wheel roller': 'Rueda Abdominal'
  };


    
  // MAPEO: Sidebar (español) → Backend (inglés)
  
  private mapeoFiltros: { [key: string]: string[] } = {
    // Categorías
    'Pecho': ['chest'],
    'Espalda': ['back'],
    'Brazos': ['upper arms', 'lower arms'],
    'Piernas': ['upper legs', 'lower legs'],
    'Hombros': ['shoulders'],
    'Cardio': ['cardio'],
    // Equipos
    'Mancuernas': ['dumbbell'],
    'Barra': ['barbell'],
    'Máquinas': ['leverage machine', 'smith machine', 'cable', 'elliptical machine', 
                 'skierg machine', 'sled machine', 'stepmill machine', 'stationary bike'],
    'Peso Corporal': ['body weight'],
    // Músculos
    'Bíceps': ['biceps'],
    'Tríceps': ['triceps'],
    'Abdomen': ['waist', 'abdominals', 'abs'],
    'Glúteos': ['glutes']
  };

  // PASO 5: Método para traducir
  traducir(clave: string): string {
    return this.nombresLegibles[clave] || clave;
  }


 // PASO 6: ngOnInit — SE EJECUTA AL ENTRAR A LA PÁGINA

  // ngOnInit = "corre esto apenas nace el componente"
  ngOnInit() {
    this.cargarEjercicios();
    this.cargarFiltros();

     // ← NUEVO: Revisar si venimos del botón "Añadir ejercicios" de una rutina
    // La URL se vería así: /ejercicios?editarRutina=64a2b3...
     const editarId = this.route.snapshot.queryParamMap.get('editarRutina');
    if (editarId) {
      this.rutinaEnEdicion.set(editarId);
    }
  }

  // PASO 7: CARGAR EJERCICIOS DESDE EL BACKEND
  cargarEjercicios() {
    this.cargando.set(true);
    
    this.ejercicioService.traerEjercicios().subscribe({
      next: (res) => {
        if (res.exitoso) {
          this.ejercicios.set(res.datos);
          this.error.set('');
        }
      },
      error: (err) => {
        this.error.set('Error al cargar ejercicios');
        this.cargando.set(false);
      },
      complete: () => {
        this.cargando.set(false);
      }
    });
  }

  // PASO 8: CARGAR FILTROS (categorías, equipos, músculos)
  cargarFiltros() {
    this.ejercicioService.traerFiltros().subscribe({
      next: (res) => {
        if (res.exitoso) {
          this.categorias.set(res.datos.categorias);
          this.equipos.set(res.datos.equipos);
          this.musculos.set(res.datos.musculos);
        }
      }
    });
  }

   // PASO 9: FILTRAR POR CATEGORÍA
  filtrarPorCategoria(categoria: string) {
    this.categoriaSeleccionada.set(categoria);
    this.cargando.set(true);
    
    // Si no hay categoría, muestra todos
    if (!categoria) {
        this.cargarEjercicios();
        return;
    }
    
     // Si elige una categoría, llama al backend filtrado
    // Filtrar por categoría
    this.ejercicioService.traerEjerciciosFiltrados(categoria, '', '').subscribe({
        next: (res) => {
            if (res.exitoso) {
                this.ejercicios.set(res.datos);
                this.error.set('');
            }
        },
        error: (err) => {
            this.error.set('Error al filtrar');
        },
        complete: () => {
            this.cargando.set(false);
        }
    });
}

// PASO 10: MODAL — ABRIR Y CERRAR
// Métodos nuevos
abrirModal(ejercicio: any) {
    this.ejercicioSeleccionado.set(ejercicio);
    this.mostrarModal.set(true);
}

cerrarModal() {
    this.ejercicioSeleccionado.set(null);
    this.mostrarModal.set(false);
}

 // PASO 11: AGREGAR A RUTINA (¡ESTE ES EL IMPORTANTE!)
agregarARutina() {
    const ejercicio = this.ejercicioSeleccionado();
     const rutinaId = this.rutinaEnEdicion(); // ← Revisa si estamos editando
    
 // CASO A: Estamos agregando a una rutina YA CREADA   
 if (rutinaId) {
      
      // 1. Traemos la rutina actual del backend
      this.rutinaService.traerRutinaPorId(rutinaId).subscribe({
        next: (res) => {
          if (res.exitoso) {
            const rutina = res.datos;
            const ejerciciosActuales = rutina.ejercicios || [];
           
       // 2. Revisar que no esté duplicado
            const yaExiste = ejerciciosActuales.some((e: any) => 
              (e.ejercicio?._id || e.ejercicio) === ejercicio._id
            );
            
            if (!yaExiste) {
              // 3. Agregamos el nuevo ejercicio con una serie por defecto
              ejerciciosActuales.push({
                ejercicio: ejercicio._id,
                series: [{ 
                  numeroSerie: 1, 
                  repeticiones: 12, 
                  pesoObjetivo: 0, 
                  descansoSegundos: 60 
                }]
              });     

               // 4. Guardamos en el backend
              this.rutinaService.actualizarRutina(rutinaId, {
                ejercicios: ejerciciosActuales
              }).subscribe({
                next: () => {
                  this.cerrarModal();
                  // 5. Volvemos al formulario de edición
                  this.router.navigate(['/crear-rutina', rutinaId]);
                },
                error: (err) => {
                  this.error.set('Error al agregar ejercicio a la rutina');
                }
              });
              
            } else {
              // Ya existe, solo cerramos y volvemos
              this.cerrarModal();
              this.router.navigate(['/crear-rutina', rutinaId]);
            }
          }
        },
        error: (err) => {
          this.error.set('Error al cargar la rutina');
        }
      });
    // CASO B: Estamos creando una rutina NUEVA
       } else {
    // 1. Leemos lo que ya tenemos guardado
    // Recuperar existentes
    const existentes = JSON.parse(localStorage.getItem('ejerciciosRutina') || '[]');
    
    // 2. Evitamos duplicados
    if (!existentes.find((e: any) => e._id === ejercicio._id)) {
        existentes.push(ejercicio);
        localStorage.setItem('ejerciciosRutina', JSON.stringify(existentes));
    }
    
    // 3. Cerramos modal
    this.cerrarModal();
    
    // Redirigir a crear rutina o mostrar mensaje
     this.router.navigate(['/crear-rutina']);
}
}

//logica para sidebar-filtros
// Método que recibe del hijo
onFiltrosCambiados(filtros: any) {
  this.filtrosActivos.set(filtros);
}

// Búsqueda por texto
onBusqueda(event: Event) {
  this.busqueda.set((event.target as HTMLInputElement).value);
}

// Limpiar todos los filtros
limpiarFiltros() {
  this.categoriaSeleccionada.set('');
  this.busqueda.set('');
  this.filtrosActivos.set({ categoria: '', equipo: '', musculo: '' });
  this.cargarEjercicios();
}

// Computed actualizado  ||computed aplica los filtros uno tras otro, como una cadena de filtros. Cada filtro reduce la lista del paso anterior.
ejerciciosFiltrados = computed(() => { //Cada filtro se aplica sobre el resultado del filtro anterior.
    let lista = this.ejercicios();  //Empieza con TODOS

    // 1. Filtro por categoría del select
    if (this.categoriaSeleccionada()) {
      lista = lista.filter((e: any) =>  //  Reduce la lista
        this.traducir(e.categoria) === this.traducir(this.categoriaSeleccionada())
      );
    }

    // 2. Filtro por búsqueda de texto
    if (this.busqueda()) {
      const texto = this.busqueda().toLowerCase();
      lista = lista.filter((e: any) =>   //  Reduce MÁS la lista
        e.nombre?.toLowerCase().includes(texto) ||
        this.traducir(e.categoria)?.toLowerCase().includes(texto) ||
        this.traducir(e.musculoObjetivo)?.toLowerCase().includes(texto)
      );
    }

    // 3. Filtros del sidebar (usando mapeo a inglés)
    const f = this.filtrosActivos();
    
    if (f.categoria) {
      const valoresEnIngles = this.mapeoFiltros[f.categoria] || [f.categoria];
      lista = lista.filter((e: any) => valoresEnIngles.includes(e.categoria)); //  Reduce MÁS
    }
    
    if (f.equipo) {
      const valoresEnIngles = this.mapeoFiltros[f.equipo] || [f.equipo];
      lista = lista.filter((e: any) => valoresEnIngles.includes(e.equipo));  //  Reduce MÁS
    }
    
    if (f.musculo) {
      const valoresEnIngles = this.mapeoFiltros[f.musculo] || [f.musculo];
      lista = lista.filter((e: any) => valoresEnIngles.includes(e.musculoObjetivo)); //  Reduce MÁS
    }

    return lista;       //  Solo quedan los que pasaron TODOS los filtros
  });

quitarFiltro(tipo: 'categoria' | 'equipo' | 'musculo') {
  const f = this.filtrosActivos();
  if (tipo === 'categoria') {
    this.filtrosActivos.set({ ...f, categoria: '' });
  } else if (tipo === 'equipo') {
    this.filtrosActivos.set({ ...f, equipo: '' });
  } else if (tipo === 'musculo') {
    this.filtrosActivos.set({ ...f, musculo: '' });
  }
}

}
