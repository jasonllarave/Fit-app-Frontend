import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';


// GUARD POR ROL: lee los roles permitidos de route.data

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  const user = auth.getUser();
  const rolActual = user?.rol || 'usuario';
  
  // Los roles permitidos vienen de la ruta: data: { roles: ['superadmin'] }
  const rolesPermitidos = route.data?.['roles'] || [];
  
  if (rolesPermitidos.includes(rolActual)) {
    return true;
  }
  
  router.navigate(['/dashboard']);
  return false;
};