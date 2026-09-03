import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PlanService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/planes`;

  traerPlanes(familia?: string): Observable<any> {

    const params = familia ? `?familia=${familia}` : '';
     return this.http.get(`${this.apiUrl}${params}`);
  }
}