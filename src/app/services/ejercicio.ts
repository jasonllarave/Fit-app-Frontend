import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root',
})
export class EjercicioService {

  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // TRAER TODOS LOS EJERCICIOS
  traerEjercicios(): Observable<any> {
    return this.http.get(`${this.apiUrl}/ejercicios`);
  }

    // TRAER CON FILTROS
  traerEjerciciosFiltrados(categoria: string, equipo: string, musculo: string): Observable<any> {
    let params = '';
    if (categoria) params += `categoria=${categoria}&`;
    if (equipo) params += `equipo=${equipo}&`;
    if (musculo) params += `musculo=${musculo}`;

    return this.http.get(`${this.apiUrl}/ejercicios?${params}`);
  }

  // TRAER UN EJERCICIO POR ID
  traerEjercicioPorId(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/ejercicios/${id}`);
  }

    // TRAER FILTROS DISPONIBLES
  traerFiltros(): Observable<any> {
    return this.http.get(`${this.apiUrl}/ejercicios/filtros`);
  }

}
