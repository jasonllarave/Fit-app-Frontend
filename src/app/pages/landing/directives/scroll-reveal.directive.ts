import { Directive, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true
})
export class ScrollRevealDirective implements AfterViewInit, OnDestroy {
  private observer?: IntersectionObserver;

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    const target = this.el.nativeElement as HTMLElement;
    // Estado inicial
    if (!target.classList.contains('reveal-left') && !target.classList.contains('reveal-right') && !target.classList.contains('reveal-up')) {
      target.classList.add('reveal-up');
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        } else {
          // Efecto reversible: se oculta al salir para repetir al volver
          entry.target.classList.remove('visible');
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    this.observer.observe(target);
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }
}
