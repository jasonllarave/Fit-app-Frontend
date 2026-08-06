import { Component, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-filtros-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filtros-sidebar.html',
  styleUrl: './filtros-sidebar.css'
})
export class FiltrosSidebar {

  // Señales de estado
  filtroCategoria = signal<string>('');
  filtroEquipo = signal<string>('');
  filtroMusculo = signal<string>('');

  // Output: emite los filtros activos al padre
  filtrosCambiados = output<{ categoria: string; equipo: string; musculo: string }>();

  // Listas de opciones
  categorias = ['Pecho', 'Espalda', 'Brazos', 'Piernas', 'Hombros', 'Cardio'];
  equipos = ['Mancuernas', 'Barra', 'Máquinas', 'Peso Corporal'];
  musculos = ['Bíceps', 'Tríceps', 'Abdomen', 'Glúteos'];

  
  // APLICAR/QUITAR FILTRO
  
  toggleFiltro(tipo: 'categoria' | 'equipo' | 'musculo', valor: string) {
    if (tipo === 'categoria') {
      this.filtroCategoria.update(v => v === valor ? '' : valor);
    } else if (tipo === 'equipo') {
      this.filtroEquipo.update(v => v === valor ? '' : valor);
    } else if (tipo === 'musculo') {
      this.filtroMusculo.update(v => v === valor ? '' : valor);
    }
    this.emitir();
  }

  limpiar() {
    this.filtroCategoria.set('');
    this.filtroEquipo.set('');
    this.filtroMusculo.set('');
    this.emitir();
  }

  private emitir() {
    this.filtrosCambiados.emit({
      categoria: this.filtroCategoria(),
      equipo: this.filtroEquipo(),
      musculo: this.filtroMusculo()
    });
  }
}