import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-formations',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './formations.html'
})
export class FormationsComponent implements OnInit {
  listeFormations: any[] = [];
  afficherFormulaire: boolean = false;
  enModeModification: boolean = false;

  nouvelleFormation: any = {
    nomFormation: '',
    niveau: 'Licence',
    typeFormation: 'Initiale',
    dateDebut: '',
    dateFin: '',
    typeFinancement: '',
    montantFinancement: null,
    nombreFormesHommes: null,
    nombreFormesFemmes: null
  };

  // URL synchronisée avec le préfixe /api/formations de ton Back-end
  private baseUrl = 'http://localhost:8080/api/formations';

  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.chargerFormations();
  }

  // Charge la liste des formations
  chargerFormations() {
    const token = localStorage.getItem('token');
    if (!token) { this.router.navigate(['/']); return; }
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<any[]>(this.baseUrl, { headers }).subscribe({
      next: (data) => { 
        this.listeFormations = data; 
        this.cdr.detectChanges(); 
      },
      error: (err) => { 
        console.error("Erreur chargement formations :", err); 
        if (err.status === 401 || err.status === 403) this.onLogout(); 
      }
    });
  }

  basculerFormulaire() {
    this.afficherFormulaire = !this.afficherFormulaire;
    if (!this.afficherFormulaire) this.annulerModification();
    this.cdr.detectChanges();
  }

  ouvrirModificationFormation(formation: any) {
    this.nouvelleFormation = { ...formation };
    this.enModeModification = true;
    this.afficherFormulaire = true;
    this.cdr.detectChanges();
  }

  // Enregistrement ou mise à jour
  validerAjoutFormation(event: Event) {
    event.preventDefault();
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 
      'Authorization': `Bearer ${token}`, 
      'Content-Type': 'application/json' 
    });

    if (this.enModeModification) {
      this.http.put(`${this.baseUrl}/${this.nouvelleFormation.id}`, this.nouvelleFormation, { headers }).subscribe({
        next: () => {
          alert("Formation mise à jour !");
          this.afficherFormulaire = false; // Ferme la modale
          this.enModeModification = false;
          this.chargerFormations();        // Rafraîchit la liste
        },
        error: (err) => console.error("Erreur modification formation :", err)
      });
    } else {
      this.http.post(this.baseUrl, this.nouvelleFormation, { headers }).subscribe({
        next: () => {
          alert("Formation enregistrée !");
          this.afficherFormulaire = false; // Ferme la modale
          this.chargerFormations();        // Rafraîchit la liste
        },
        error: (err) => console.error("Erreur ajout formation :", err)
      });
    }
  }

  // Suppression d'une formation
  supprimerFormation(id: number) {
    if (confirm('Voulez-vous vraiment supprimer cette formation ?')) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
      
      this.http.delete(`${this.baseUrl}/${id}`, { headers }).subscribe({
        next: () => { 
          alert("Formation supprimée."); 
          this.chargerFormations(); 
        },
        error: (err) => console.error("Erreur suppression formation :", err)
      });
    }
  }

  annulerModification() {
    this.nouvelleFormation = { nomFormation: '', niveau: 'Licence', typeFormation: 'Initiale', dateDebut: '', dateFin: '', typeFinancement: '', montantFinancement: null, nombreFormesHommes: null, nombreFormesFemmes: null };
    this.enModeModification = false;
  }

  exporterPDF() { window.print(); }
  onLogout() { localStorage.removeItem('token'); this.router.navigate(['/']); }
}