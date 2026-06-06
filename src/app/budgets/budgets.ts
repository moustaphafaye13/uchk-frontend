import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; // <-- CRUCIAL POUR LES FORMULAIRES

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule], // <-- AJOUT DE FORMSMODULE HERE
  templateUrl: './budgets.html'
})
export class BudgetsComponent implements OnInit {
  listeBudgets: any[] = [];
  
  // Variables pour le formulaire
  afficherFormulaire: boolean = false;
  nouveauBudget: any = {
    annee: null,
    montantProjet: null,
    montantRealise: null,
    noteOrientationUrl: ''
  };

  constructor(
    private http: HttpClient, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.chargerBudgets();
  }

  chargerBudgets() {
    const token = localStorage.getItem('token');
    if (!token) { this.router.navigate(['/']); return; }

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<any[]>('http://localhost:8080/api/budgets', { headers }).subscribe({
      next: (data) => {
        this.listeBudgets = data;
        this.cdr.detectChanges();
      },
      error: (err) => { if (err.status === 401 || err.status === 403) this.onLogout(); }
    });
  }

  basculerFormulaire() {
    this.afficherFormulaire = !this.afficherFormulaire;
  }

  validerAjoutBudget(event: Event) {
    event.preventDefault(); // Éviter le rechargement de page
    
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // Envoi du POST vers ton Spring Boot
    this.http.post('http://localhost:8080/api/budgets', this.nouveauBudget, { headers }).subscribe({
      next: (res) => {
        console.log("Budget ajouté avec succès !");
        this.afficherFormulaire = false; // Fermer le formulaire
        // Réinitialiser le formulaire
        this.nouveauBudget = { annee: null, montantProjet: null, montantRealise: null, noteOrientationUrl: '' };
        this.chargerBudgets(); // Rafraîchir instantanément la liste
      },
      error: (err) => {
        console.error("Erreur lors de l'ajout :", err);
      }
    });
  }

  onLogout() {
    localStorage.removeItem('token');
    this.router.navigate(['/']);
  }

  // Ajoute cette méthode parmi les autres fonctions de ton composant BudgetsComponent
  exporterPDF() {
    window.print();
  }
}