import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EjercicioService } from '../../../../services/ejercicio';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-landing-progreso',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progreso.html',
  styleUrl: './progreso.css'
})
export class LandingProgreso implements OnInit {
  private ejercicioService = inject(EjercicioService);
  gifUrl = signal<string>('');
  gifCollage = signal<string[]>([]);

  private fallbackGifs = [
    'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
    'https://media.giphy.com/media/l0HlN5knQ4aWq2iys/giphy.gif',
    'https://media.giphy.com/media/3o6ZsVGl3m1Qw7C6ys/giphy.gif',
    'https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif',
    'https://media.giphy.com/media/3o7TKr3nzbh5WgFyuCA/giphy.gif'
  ];

  ngOnInit() {
    this.ejercicioService.traerEjercicios().subscribe({
      next: (res: any) => {
        const lista = (res.datos || []).filter((e: any) => e.gif);
        const base = environment.apiUrl.replace('/api', '');
        if (lista.length) {
          const first = lista[0];
          const gif = first.gif.startsWith('/') ? first.gif : '/' + first.gif;
          this.gifUrl.set(base + gif);
          const collage = lista.slice(0, 5).map((e: any) => {
            const g = e.gif.startsWith('/') ? e.gif : '/' + e.gif;
            return base + g;
          });
          while (collage.length < 5 && collage.length > 0) {
            collage.push(collage[collage.length % lista.length]);
          }
          this.gifCollage.set(collage);
        } else {
          this.gifCollage.set(this.fallbackGifs);
        }
      },
      error: () => {
        this.gifUrl.set('');
        this.gifCollage.set(this.fallbackGifs);
      }
    });
    // precarga fallback inmediato para que se vea sin esperar backend
    if (!this.gifCollage().length) {
      this.gifCollage.set(this.fallbackGifs);
    }
  }
}
