import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RutinaService {

  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // TRAER RUTINAS DEL USUARIO
  traerRutinas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/rutinas`);
  }

  // CREAR RUTINA
  crearRutina(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/rutinas`, datos);
  }

  // TRAER UNA RUTINA POR ID
  traerRutinaPorId(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/rutinas/${id}`);
  }

  
  actualizarRutina(id: string, datos: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/rutinas/${id}`, datos);
  }

  desactivarRutina(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/rutinas/${id}/desactivar`, {});
  }

  eliminarRutina(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/rutinas/${id}`);
  }

}