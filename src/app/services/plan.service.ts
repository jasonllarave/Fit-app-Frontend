import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PlanService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/planes';

  traerPlanes(familia?: string): Observable<any> {

    const params = familia ? `?familia=${familia}` : '';
     return this.http.get(`${this.apiUrl}${params}`);
  }
}