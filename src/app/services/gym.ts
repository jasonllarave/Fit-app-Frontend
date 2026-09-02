import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GymService {

  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  toggleRecompensas(gymId: string, activas: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/gyms/${gymId}/recompensas`, {
      recompensasActivas: activas
    });
  }

  // TRAER TODOS LOS GIMNASIOS
  traerGimnasios(): Observable<any> {
    return this.http.get(`${this.apiUrl}/gyms`);
  }

  // ACTUALIZAR GIMNASIO (activar/desactivar inscripción, plan, etc.)
  actualizarGimnasio(id: string, datos: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/gyms/${id}`, datos);
  }
}