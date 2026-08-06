import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SesionService { // Sesiones (workout) con Anti-Trampa

  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  traerSesiones(): Observable<any> {
    return this.http.get(`${this.apiUrl}/sesiones`);
  }

  traerSesionPorId(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/sesiones/${id}`);
  }

  crearSesion(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/sesiones`, datos);
  }

  actualizarSesion(id: string, datos: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/sesiones/${id}`, datos);
  }

  eliminarSesion(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/sesiones/${id}`);
  }
}