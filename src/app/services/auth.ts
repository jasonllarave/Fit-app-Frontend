import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})

export class AuthService {

  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  login(email: string, password: string): Observable<any>{
    return this.http.post(`${this.apiUrl}/auth/login`, {email, password});
  }

  register(datos: any): Observable<any>{
    return this.http.post(`${this.apiUrl}/auth/register`, datos);
  }

  // Borrar (logout)
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Verificar si está logueado
  isLogged(): boolean {
    return !!localStorage.getItem('token');
  }

  // Leer (auth service)
  getToken(): string | null {
    return localStorage.getItem('token');
  }


  // LEER USUARIO DEL LOCALSTORAGE 
  getUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
   
  // TRAER PERFIL COMPLETO
 
  traerPerfil(): Observable<any> {
    const user = this.getUser();
     if (!user?.id) {
      return new Observable(); // Vacío si no hay usuario
    }
    return this.http.get(`${this.apiUrl}/users/${user?.id}`);
  }

  
  // ACTUALIZAR PERFIL
  
  actualizarPerfil(datos: any): Observable<any> {
    const user = this.getUser();
    if (!user?.id) {
      return new Observable();
    }
    return this.http.put(`${this.apiUrl}/users/${user?.id}`, datos);
  }



    
  // VERIFICAR ROL
  
  getRol(): string {
    return this.getUser()?.rol || 'usuario';
  }

  isSuperAdmin(): boolean {
    return this.getRol() === 'superadmin';
  }

  isAdmin(): boolean {
    return this.getRol() === 'admin';
  }

  isEntrenador(): boolean {
    return this.getRol() === 'entrenador';
  }

  
  // SUPERADMIN: traer todos los usuarios
  
  traerTodosUsuarios(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`);
  }

  
  // SUPERADMIN: cambiar rol de usuario
  
  actualizarRolUsuario(userId: string, rol: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${userId}`, { rol });
  }

  
  // ADMIN GYM: traer usuarios de mi gym
  
  traerUsuariosGym(): Observable<any> {
    const user = this.getUser();
    return this.http.get(`${this.apiUrl}/users/gym/${user?.gymId}`);
  }


}
