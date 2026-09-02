import { Component, signal, inject, OnInit, AfterViewInit } from '@angular/core';
import { PlanService } from '../../../services/plan.service';

// Componentes separados
import { LandingTopbar } from '../components/topbar/topbar';
import { LandingHero } from '../components/hero/hero';
import { LandingProgreso } from '../components/progreso/progreso';
import { LandingRanking } from '../components/ranking/ranking';
import { LandingGym } from '../components/gym-section/gym-section';
import { LandingEcg } from '../components/ecg/ecg';
import { LandingPricing } from '../components/pricing/pricing';
import { LandingCta } from '../components/cta/cta';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [LandingTopbar, LandingHero, LandingProgreso, LandingRanking, LandingGym, LandingEcg, LandingPricing, LandingCta],
  templateUrl: './landing.html',
  styleUrl: './landing.css'
})
export class Landing implements OnInit, AfterViewInit {
  private planService = inject(PlanService);
  
  planesIndividuo = signal<any[]>([]);
  planesGym = signal<any[]>([]);
  cargando = signal(true);

  ngOnInit() {
    this.planService.traerPlanes('individuo').subscribe({
      next: (res: any) => {
        this.planesIndividuo.set(res.datos || []);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
    
    this.planService.traerPlanes('gym').subscribe({
      next: (res: any) => this.planesGym.set(res.datos || [])
    });
  }

  ngAfterViewInit() {
    // esperar a que los hijos rendericen
    setTimeout(() => this.initScrollReveal(), 500);
  }

  private initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        } else {
          entry.target.classList.remove('visible');
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal-left, .reveal-right, .reveal-up').forEach(el => observer.observe(el));
  }
}
