import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { PlanService } from '../../services/plan.service';
import { GymService } from '../../services/gym';

type TipoCuenta = 'independiente' | 'cliente_gym' | 'admin_gym';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register implements OnInit {

  private authService = inject(AuthService);
  private planService = inject(PlanService);
  private gymService = inject(GymService);

  errorMessage = signal('');
  successMessage = signal('');
  cargando = signal(false);

  // Planes para admin_gym
  planesGym = signal<any[]>([]);
  cargandoPlanes = signal(false);

  // Gyms para cliente_gym
  gyms = signal<any[]>([]);
  cargandoGyms = signal(false);
  busquedaGym = signal('');

  registerForm = new FormGroup({
    nombres: new FormControl('', [Validators.required]),
    apellidos: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    telefono: new FormControl(''),
    ciudad: new FormControl(''),
    tipoCuenta: new FormControl<TipoCuenta>('independiente', [Validators.required]),
    planSlug: new FormControl('free'), // para admin_gym será starter/growth/enterprise
    // cliente_gym
    gymId: new FormControl(''),
    // admin_gym
    nombreGym: new FormControl(''),
    direccion: new FormControl(''),
    telefonoGym: new FormControl(''),
    ciudadGym: new FormControl(''),
  });

  // Computados para filtrar gyms por búsqueda
  gymsFiltrados = computed(() => {
    const q = this.busquedaGym().toLowerCase().trim();
    const lista = this.gyms();
    if (!q) return lista;
    return lista.filter((g: any) =>
      g.nombre?.toLowerCase().includes(q) ||
      g.ciudad?.toLowerCase().includes(q) ||
      g.direccion?.toLowerCase().includes(q)
    );
  });

  ngOnInit() {
    this.cargarPlanesGym();
    this.cargarGyms();

    // Sincronizar planSlug según tipoCuenta
    this.registerForm.get('tipoCuenta')?.valueChanges.subscribe((tipo) => {
      if (tipo === 'admin_gym') {
        const actual = this.registerForm.value.planSlug;
        if (['free', 'pro', 'coach'].includes(actual || '')) {
          this.registerForm.patchValue({ planSlug: 'starter' }, { emitEvent: false });
        }
      } else {
        const actual = this.registerForm.value.planSlug;
        if (['starter', 'growth', 'enterprise'].includes(actual || '')) {
          this.registerForm.patchValue({ planSlug: 'free' }, { emitEvent: false });
        }
      }
      // limpiar mensajes al cambiar
      this.errorMessage.set('');
    });
  }

  cargarPlanesGym() {
    this.cargandoPlanes.set(true);
    this.planService.traerPlanes('gym').subscribe({
      next: (res) => {
        const lista = res.datos || res || [];
        if (Array.isArray(lista) && lista.length) this.planesGym.set(lista);
        else this.planesGym.set(this.planesFallback());
      },
      error: () => this.planesGym.set(this.planesFallback()),
      complete: () => this.cargandoPlanes.set(false)
    });
  }

  cargarGyms() {
    this.cargandoGyms.set(true);
    this.gymService.traerGimnasios().subscribe({
      next: (res) => {
        const lista = res.datos || res || [];
        this.gyms.set(Array.isArray(lista) ? lista.filter((g: any) => g.activo !== false) : []);
      },
      error: () => this.gyms.set([]),
      complete: () => this.cargandoGyms.set(false)
    });
  }

  planesFallback() {
    return [
      { slug: 'starter', nombre: 'Starter', precioMensualCOP: 80000, descripcion: 'Hasta 40 miembros' },
      { slug: 'growth', nombre: 'Growth', precioMensualCOP: 200000, descripcion: 'Hasta 110 miembros' },
      { slug: 'enterprise', nombre: 'Enterprise', precioMensualCOP: 500000, descripcion: 'Miembros ilimitados' },
    ];
  }

  // Helpers para template
  tipoCuenta(): TipoCuenta {
    return this.registerForm.value.tipoCuenta as TipoCuenta;
  }
  esIndependiente(): boolean { return this.tipoCuenta() === 'independiente'; }
  esClienteGym(): boolean { return this.tipoCuenta() === 'cliente_gym'; }
  esAdminGym(): boolean { return this.tipoCuenta() === 'admin_gym'; }

  seleccionarTipo(t: TipoCuenta) {
    this.registerForm.patchValue({ tipoCuenta: t });
  }

  seleccionarGym(gymId: string) {
    this.registerForm.patchValue({ gymId });
  }

  onRegister() {
    // Validación base
    if (this.registerForm.get('nombres')?.invalid ||
        this.registerForm.get('apellidos')?.invalid ||
        this.registerForm.get('email')?.invalid ||
        this.registerForm.get('password')?.invalid) {
      this.errorMessage.set('Completa nombre, apellidos, email y contraseña (mín. 6 caracteres)');
      return;
    }

    const tipo = this.tipoCuenta();

    // Validaciones por tipo
    if (tipo === 'admin_gym') {
      if (!this.registerForm.value.nombreGym?.trim() || !this.registerForm.value.direccion?.trim()) {
        this.errorMessage.set('Para registrar tu gimnasio indica nombre y dirección');
        return;
      }
    }
    if (tipo === 'cliente_gym') {
      if (!this.registerForm.value.gymId) {
        this.errorMessage.set('Selecciona el gimnasio al que perteneces. Si no está en la lista, elige “Mi gym no aparece”');
        return;
      }
    }

    this.cargando.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    // Rama ADMIN_GYM -> POST /auth/register-gym
    if (tipo === 'admin_gym') {
      const datosGym = {
        nombreGym: this.registerForm.value.nombreGym?.trim(),
        direccion: this.registerForm.value.direccion?.trim(),
        telefonoGym: this.registerForm.value.telefonoGym?.trim() || this.registerForm.value.telefono?.trim(),
        ciudadGym: this.registerForm.value.ciudadGym?.trim() || this.registerForm.value.ciudad?.trim() || 'no especificada',
        emailContacto: this.registerForm.value.email?.trim(),
        nombres: this.registerForm.value.nombres?.trim(),
        apellidos: this.registerForm.value.apellidos?.trim(),
        email: this.registerForm.value.email?.trim(),
        password: this.registerForm.value.password?.trim(),
        telefono: this.registerForm.value.telefono?.trim(),
        planSlug: this.registerForm.value.planSlug || 'starter'
      };
      this.authService.registerGym(datosGym).subscribe({
        next: (res) => {
          if (res.exitoso) {
            localStorage.setItem('token', res.token);
            localStorage.setItem('user', JSON.stringify(res.usuario));
            this.successMessage.set(res.mensaje || '¡Gimnasio creado! Redirigiendo...');
            setTimeout(() => this.authService.redirigirSegunRol(), 700);
          } else this.errorMessage.set(res.mensaje || 'Error al registrar gimnasio');
        },
        error: (err) => {
          this.errorMessage.set(err.error?.mensaje || err.error?.error || 'Error al registrar gimnasio');
          this.cargando.set(false);
        },
        complete: () => this.cargando.set(false)
      });
      return;
    }

    // Rama CLIENTE_GYM -> POST /auth/register con gymId
    if (tipo === 'cliente_gym') {
      const datosCliente = {
        nombres: this.registerForm.value.nombres?.trim(),
        apellidos: this.registerForm.value.apellidos?.trim(),
        email: this.registerForm.value.email?.trim(),
        password: this.registerForm.value.password?.trim(),
        telefono: this.registerForm.value.telefono?.trim(),
        ciudad: this.registerForm.value.ciudad?.trim() || 'no especificada',
        tipoUsuario: 'gym',
        gymId: this.registerForm.value.gymId,
        rol: 'usuario'
      };
      this.authService.register(datosCliente).subscribe({
        next: (res) => {
          if (res.exitoso) {
            localStorage.setItem('token', res.token);
            localStorage.setItem('user', JSON.stringify(res.usuario));
            this.successMessage.set('¡Cuenta creada y vinculada a tu gym!');
            setTimeout(() => this.authService.redirigirSegunRol(), 700);
          } else this.errorMessage.set(res.mensaje || 'Error al registrarse');
        },
        error: (err) => {
          this.errorMessage.set(err.error?.mensaje || err.error?.error || 'Error al registrarse');
          this.cargando.set(false);
        },
        complete: () => this.cargando.set(false)
      });
      return;
    }

    // Rama INDEPENDIENTE -> POST /auth/register sin gymId
    const datos = {
      nombres: this.registerForm.value.nombres?.trim(),
      apellidos: this.registerForm.value.apellidos?.trim(),
      email: this.registerForm.value.email?.trim(),
      password: this.registerForm.value.password?.trim(),
      telefono: this.registerForm.value.telefono?.trim(),
      ciudad: this.registerForm.value.ciudad?.trim() || 'no especificada',
      tipoUsuario: 'independiente',
      rol: 'usuario'
    };
    this.authService.register(datos).subscribe({
      next: (res) => {
        if (res.exitoso) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.usuario));
          this.authService.redirigirSegunRol();
        } else this.errorMessage.set(res.mensaje || 'Error al registrarse');
      },
      error: (err) => {
        this.errorMessage.set(err.error?.mensaje || 'Error al registrarse');
        this.cargando.set(false);
      },
      complete: () => this.cargando.set(false)
    });
  }
}
