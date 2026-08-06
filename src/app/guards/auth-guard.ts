import { CanActivateFn, Router } from '@angular/router'; // CanActivateFn función que Angular ejecuta antes de cargar una ruta para decidir si el usuario puede entrar o no.
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';


// GUARD: redirige a login si no hay token

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService); //  Pregunta: ¿hay token?
  const router = inject(Router);   //   Para redirigir si no hay
  
  if (auth.isLogged()) {
    return true;                  //   Portero: "Pase"
  }
  
  // No hay token → al login
  router.navigate(['/login']);  //   Portero: "Vaya al login"
  return false;                 //   Bloquea la ruta
};

