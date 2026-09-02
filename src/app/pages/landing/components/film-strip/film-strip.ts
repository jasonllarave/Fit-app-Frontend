import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EjercicioService } from '../../../../services/ejercicio';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-film-strip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './film-strip.html',
  styleUrl: './film-strip.css'
})
export class FilmStrip implements OnInit {
  private ejercicioService = inject(EjercicioService);
  images = signal<string[]>([]);
  private fallback = [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=260&fit=crop',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=260&fit=crop',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=260&fit=crop',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=260&fit=crop',
    'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=400&h=260&fit=crop',
    'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=400&h=260&fit=crop',
    'https://images.unsplash.com/photo-1526509867162-5b0c0d1b4b33?w=400&h=260&fit=crop',
    'https://images.unsplash.com/photo-1558611848-73f7eb4001a1?w=400&h=260&fit=crop'
  ];

  ngOnInit() {
    this.ejercicioService.traerEjercicios().subscribe({
      next: (res: any) => {
        const lista = (res.datos || []).filter((e: any) => e.gif || e.imagen);
        const base = environment.apiUrl.replace('/api', '');
        if (lista.length) {
          const urls = lista.slice(0, 8).map((e: any) => {
            const src = e.gif || e.imagen;
            const path = src.startsWith('/') ? src : '/' + src;
            return base + path;
          });
          // duplicar para loop infinito
          this.images.set([...urls, ...urls]);
        } else {
          this.images.set([...this.fallback, ...this.fallback]);
        }
      },
      error: () => this.images.set([...this.fallback, ...this.fallback])
    });
    if (!this.images().length) {
      this.images.set([...this.fallback, ...this.fallback]);
    }
  }
}
