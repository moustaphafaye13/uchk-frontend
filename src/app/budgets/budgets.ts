import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './budgets.html'
})
export class BudgetsComponent implements OnInit {
  listeBudgets: any[] = [];
  afficherFormulaire: boolean = false;
  enModeModification: boolean = false;

  nouveauBudget: any = {
    annee: null,
    montantProjet: null,
    montantRealise: null,
    noteOrientationUrl: ''
  };

  // URL synchronisée avec ton @RequestMapping("/api/budgets")
  private baseUrl = 'http://localhost:8080/api/budgets';

  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.chargerBudgets();
  }

  chargerBudgets() {
    const token = localStorage.getItem('token');
    if (!token) { this.router.navigate(['/']); return; }
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<any[]>(this.baseUrl, { headers }).subscribe({
      next: (data) => { 
        this.listeBudgets = data; 
        this.cdr.detectChanges(); 
      },
      error: (err) => { 
        console.error("Erreur de chargement budgets :", err); 
        if (err.status === 401 || err.status === 403) this.onLogout(); 
      }
    });
  }

  basculerFormulaire() {
    this.afficherFormulaire = !this.afficherFormulaire;
    if (!this.afficherFormulaire) this.annulerModification();
    this.cdr.detectChanges();
  }

  ouvrirModificationBudget(budget: any) {
    this.nouveauBudget = { ...budget };
    this.enModeModification = true;
    this.afficherFormulaire = true;
    this.cdr.detectChanges();
  }

  validerAjoutBudget(event: Event) {
    event.preventDefault();
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 
      'Authorization': `Bearer ${token}`, 
      'Content-Type': 'application/json' 
    });

    if (this.enModeModification) {
      // Appelle ta méthode @PutMapping("/{id}")
      this.http.put(`${this.baseUrl}/${this.nouveauBudget.id}`, this.nouveauBudget, { headers }).subscribe({
        next: () => {
          alert("Budget mis à jour !");
          this.afficherFormulaire = false;
          this.enModeModification = false;
          this.chargerBudgets();
        },
        error: (err) => console.error("Erreur modification budget :", err)
      });
    } else {
      // Appelle ta méthode @PostMapping
      this.http.post(this.baseUrl, this.nouveauBudget, { headers }).subscribe({
        next: () => {
          alert("Budget enregistré !");
          this.afficherFormulaire = false;
          this.chargerBudgets();
        },
        error: (err) => console.error("Erreur ajout budget :", err)
      });
    }
  }

  supprimerBudget(id: number) {
    if (confirm('Voulez-vous vraiment supprimer ce budget ?')) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
      
      // Appelle ta méthode @DeleteMapping("/{id}")
      this.http.delete(`${this.baseUrl}/${id}`, { headers }).subscribe({
        next: () => { 
          alert("Budget supprimé."); 
          this.chargerBudgets(); 
        },
        error: (err) => console.error("Erreur suppression budget :", err)
      });
    }
  }

  annulerModification() {
    this.nouveauBudget = { annee: null, montantProjet: null, montantRealise: null, noteOrientationUrl: '' };
    this.enModeModification = false;
  }

  exporterPDF() { window.print(); }
  onLogout() { localStorage.removeItem('token'); this.router.navigate(['/']); }
}