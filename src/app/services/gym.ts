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
    return this.http.patch(`${this.apiUrl}/gimnasios/${gymId}/recompensas`, {
      recompensasActivas: activas
    });
  }
}