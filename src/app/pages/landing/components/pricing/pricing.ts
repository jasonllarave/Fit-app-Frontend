import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-pricing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './pricing.html',
  styleUrl: './pricing.css'
})
export class LandingPricing {
  planesIndividuo = input<any[]>([]);
  planesGym = input<any[]>([]);

  formatearPrecio(valor: number): string {
    if (valor === 0) return 'Gratis';
    return '$' + valor.toLocaleString('es-CO');
  }

  formatearFeature(f: string): string {
    if (!f) return '';
    return f.replace(/_/g, ' ');
  }
}
