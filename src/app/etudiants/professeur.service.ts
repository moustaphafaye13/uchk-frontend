import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interface représentant l'entité Professeur du Backend
export interface Professeur {
  id?: number;
  codeMatricule: string;
  nom: string;
  prenom: string;
  email?: string;
  specialite: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfesseurService {

  // URL connectée à ton ProfesseurController Spring Boot
  private apiUrl = 'http://localhost:8080/professeurs';

  constructor(private http: HttpClient) { }

  // 1. Récupérer la liste des professeurs
  getAll(): Observable<Professeur[]> {
    return this.http.get<Professeur[]>(this.apiUrl);
  }

  // 2. Ajouter un professeur (avec l'email en RequestParam comme ton EtudiantController)
  add(professeur: Professeur, email: string): Observable<Professeur> {
    const params = new HttpParams().set('email', email);
    return this.http.post<Professeur>(this.apiUrl, professeur, { params });
  }

  // 3. Modifier un professeur
  update(id: number, professeur: Professeur, email: string): Observable<Professeur> {
    const params = new HttpParams().set('email', email);
    return this.http.put<Professeur>(`${this.apiUrl}/${id}`, professeur, { params });
  }

  // 4. Supprimer un professeur
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}