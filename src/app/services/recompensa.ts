import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RecompensaService {

  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  traerRecompensas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/recompensas`);
  }

  misPuntos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/recompensas/mis-puntos`);
  }

  ganarPuntos(datos: { cantidad: number; motivo: string; sesion?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/recompensas/puntos`, datos);
  }

  canjearRecompensa(recompensaId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/recompensas/canjear`, { recompensaId });
  }

  crearRecompensa(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/recompensas`, datos);
  }

  // Editar o activar/desactivar una recompensa (admin del gym / superadmin)
  actualizarRecompensa(id: string, datos: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/recompensas/${id}`, datos);
  }

  // Eliminar una recompensa (admin del gym / superadmin)
  eliminarRecompensa(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/recompensas/${id}`);
  }
}