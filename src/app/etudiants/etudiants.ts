import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // <-- ON IMPORTE LE DETECTEUR
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router'; // <-- AJOUTE "RouterModule" ICI

@Component({
  selector: 'app-etudiants',
  standalone: true,
  imports: [CommonModule, RouterModule], // <-- AJOUTE "RouterModule" ICI AUSSI
  templateUrl: './etudiants.html'
})
export class EtudiantsComponent implements OnInit {
  listeEtudiants: any[] = [];

  // ON INJECTE "private cdr: ChangeDetectorRef" DANS LE CONSTRUCTOR :
  constructor(
    private http: HttpClient, 
    private router: Router,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit() {
    const token = localStorage.getItem('token');
    
    if (!token) {
      this.router.navigate(['/']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<any[]>('http://localhost:8080/etudiants', { headers }).subscribe({
      next: (data) => {
        console.log("Données reçues de MySQL :", data);
        this.listeEtudiants = data;
        
        // CORRECTION MAJEURE : On force Angular à rafraîchir l'écran immédiatement !
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error("Erreur lors du rechargement :", err);
        if (err.status === 401 || err.status === 403) {
          this.onLogout();
        }
      }
    });
  }

  onLogout() {
    localStorage.removeItem('token');
    this.router.navigate(['/']);
  }
}