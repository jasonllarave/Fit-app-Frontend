import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Layout } from './layout/layout';

// Públicas
import { Register } from './pages/register/register';
import { Dashboard } from './pages/dashboard/dashboard';

import { Landing } from './pages/landing/landing/landing';

// Privadas
import { Rutinas } from './pages/rutinas/rutinas';
import { Sesiones } from './pages/sesiones/sesiones';
import { Progreso } from './pages/progreso/progreso';
import { Recompensas } from './pages/recompensas/recompensas';
import { Ejercicios } from './pages/ejercicios/ejercicios';
import { CrearRutina } from './pages/crear-rutina/crear-rutina';
import { DetalleRutina } from './pages/detalle-rutina/detalle-rutina';
import { IniciarSesion } from './pages/iniciar-sesion/iniciar-sesion';
import { Entrenamiento } from './pages/entrenamiento/entrenamiento';
import { authGuard } from './guards/auth-guard';
import { Perfil } from './pages/perfil/perfil';


//Roles
import { roleGuard } from './guards/role.guard';
import { Admin } from './pages/admin/admin';
import { AdminGym } from './pages/admin-gym/admin-gym';



export const routes: Routes = [

     // RUTAS PÚBLICAS (sin sidebar)
     { path: 'login', component: Login },
     { path: 'register', component: Register },
     { path: '', component: Landing },

     // RUTAS PRIVADAS (con sidebar + navbar)

      { path: '', component: Layout, canActivate: [authGuard], children: [

    { path: '', redirectTo: 'login', pathMatch: 'full' }, 
    { path: 'dashboard', component: Dashboard },
    { path: 'rutinas', component: Rutinas },
    { path: 'rutina/:id', component: DetalleRutina },
    { path: 'sesiones', component: Sesiones },
    { path: 'progreso', component: Progreso },
    { path: 'recompensas', component: Recompensas },
    { path: 'ejercicios', component: Ejercicios },
    { path: 'crear-rutina', component: CrearRutina },
    { path: 'crear-rutina/:id', component: CrearRutina }, 
    { path: 'iniciar-sesion/:rutinaId', component: IniciarSesion },
    { path: 'entrenamiento/:id', component: Entrenamiento },
    { path: 'perfil', component: Perfil },

    { path: 'admin', component: Admin, canActivate: [roleGuard], data: { roles: ['superadmin'] } }, // SUPERADMIN: solo superadmin

    { path: 'admin-gym', component: AdminGym, canActivate: [roleGuard], data: { roles: [ 'admin','superadmin'] } },  // ADMIN GYM: admin y superadmin

        ]
    },

    // REDIRECCIONES
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: '**', redirectTo: 'login' },
   

];
