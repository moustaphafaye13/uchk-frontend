import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; // <-- IMPORTATION OBLIGATOIRE

@Component({
  selector: 'app-formations',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule], // <-- AJOUT DE FORMSMODULE HERE
  templateUrl: './formations.html'
})
export class FormationsComponent implements OnInit {
  listeFormations: any[] = [];
  
  // Variables de gestion du formulaire d'ajout
  afficherFormulaire: boolean = false;
  nouvelleFormation: any = {
    nomFormation: '',
    niveau: 'Licence',
    typeFormation: 'Initiale',
    dateDebut: '',
    dateFin: '',
    typeFinancement: '',
    montantFinancement: null,
    nombreFormesHommes: 0,
    nombreFormesFemmes: 0
  };

  constructor(
    private http: HttpClient, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.chargerFormations();
  }

  chargerFormations() {
    const token = localStorage.getItem('token');
    if (!token) { this.router.navigate(['/']); return; }

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<any[]>('http://localhost:8080/api/formations', { headers }).subscribe({
      next: (data) => {
        this.listeFormations = data;
        this.cdr.detectChanges();
      },
      error: (err) => { if (err.status === 401 || err.status === 403) this.onLogout(); }
    });
  }

  basculerFormulaire() {
    this.afficherFormulaire = !this.afficherFormulaire;
  }

  validerAjoutFormation(event: Event) {
    event.preventDefault();

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // Envoi de la requête POST vers ton controlleur Spring Boot
    this.http.post('http://localhost:8080/api/formations', this.nouvelleFormation, { headers }).subscribe({
      next: (res) => {
        console.log("Formation enregistrée avec succès !");
        this.afficherFormulaire = false; // Fermer le volet
        // Réinitialisation de l'objet
        this.nouvelleFormation = {
          nomFormation: '', niveau: 'Licence', typeFormation: 'Initiale',
          dateDebut: '', dateFin: '', typeFinancement: '',
          montantFinancement: null, nombreFormesHommes: 0, nombreFormesFemmes: 0
        };
        this.chargerFormations(); // Rechargement dynamique de la liste
      },
      error: (err) => {
        console.error("Erreur lors de l'enregistrement de la formation :", err);
      }
    });
  }

  onLogout() {
    localStorage.removeItem('token');
    this.router.navigate(['/']);
  }

  // Ajoute cette méthode à l'intérieur de ta classe FormationsComponent
  exporterPDF() {
    window.print();
  }
}