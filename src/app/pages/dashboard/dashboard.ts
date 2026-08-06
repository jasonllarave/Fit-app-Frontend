import { Component, signal, inject, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RutinaService } from '../../services/rutina';
import { SesionService } from '../../services/sesion';
import { RecompensaService } from '../../services/recompensa';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  private rutinaService = inject(RutinaService);
  private sesionService = inject(SesionService);
  private recompensaService = inject(RecompensaService);

  // Datos del usuario
  usuario = signal<any>(JSON.parse(localStorage.getItem('user') || '{}'));

  // Señales de estado
  rutinas = signal<any[]>([]);
  sesiones = signal<any[]>([]);
  puntos = signal<any>(null);
  cargando = signal(false);
  error = signal('');

  // Día de hoy en español (minúscula, para comparar con diasSemana)
  diaHoy = signal<string>('');

  ngOnInit() {
    this.diaHoy.set(this.obtenerDiaHoy());
    this.cargarDatos();
  }

  // ============================================
  // OBTENER DÍA DE HOY EN ESPAÑOL
  // ============================================
  obtenerDiaHoy(): string {
    const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    return dias[new Date().getDay()];
  }

  // ============================================
  // CARGAR TODOS LOS DATOS
  // ============================================
  cargarDatos() {
    this.cargando.set(true);

    // Traer rutinas
    this.rutinaService.traerRutinas().subscribe({
      next: (res) => {
        if (res.exitoso) {
          this.rutinas.set(res.datos);
        }
      },
      error: (err) => {
        this.error.set(err.error?.mensaje || 'Error al cargar rutinas');
      }
    });

    // Traer sesiones
    this.sesionService.traerSesiones().subscribe({
      next: (res) => {
        if (res.exitoso) {
          this.sesiones.set(res.datos);
        }
      },
      error: (err) => {
        this.error.set(err.error?.mensaje || 'Error al cargar sesiones');
      }
    });

    // Traer puntos
    this.recompensaService.misPuntos().subscribe({
      next: (res) => {
        if (res.exitoso) {
          this.puntos.set(res.datos);
        }
      },
      complete: () => {
        this.cargando.set(false);
      }
    });
  }

 
  // COMPUTED: RUTINAS ACTIVAS
 
  rutinasActivas = computed(() => 
    this.rutinas().filter((r: any) => r.activa)
  );

  
  // COMPUTED: RUTINAS DE HOY
  
  rutinasHoy = computed(() => 
    this.rutinasActivas().filter((r: any) => 
      r.diasSemana?.includes(this.diaHoy())
    )
  );

  
  // COMPUTED: TOTAL SESIONES COMPLETADAS
 
  totalSesiones = computed(() => 
    this.sesiones().filter((s: any) => s.completada).length
  );

  
  // COMPUTED: SESIONES DE ESTA SEMANA
  
  sesionesEstaSemana = computed(() => {
    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    return this.sesiones().filter((s: any) => {
      if (!s.completada) return false;
      const fecha = new Date(s.fecha);
      return fecha >= inicioSemana;
    });
  });

  
  // COMPUTED: ÚLTIMA SESIÓN

  ultimaSesion = computed(() => {
    const completadas = this.sesiones()
      .filter((s: any) => s.completada)
      .sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    return completadas[0] || null;
  });

  
  // COMPUTED: RACHA DE DÍAS
  
  racha = computed(() => {
    const s = this.sesiones().filter((x: any) => x.completada);
    if (s.length === 0) return 0;

    const diasConSesion = new Set(
      s.map((x: any) => new Date(x.fecha).toISOString().split('T')[0])
    );

    let racha = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

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

  
  // TRADUCIR DÍA
  
  traducirDia(dia: string): string {
    const dias: { [key: string]: string } = {
      'lunes': 'Lun', 'martes': 'Mar', 'miercoles': 'Mié',
      'jueves': 'Jue', 'viernes': 'Vie', 'sabado': 'Sáb', 'domingo': 'Dom'
    };
    return dias[dia] || dia;
  }
}