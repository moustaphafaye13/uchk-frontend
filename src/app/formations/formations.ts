import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

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

  constructor(
    private http: HttpClient, 
    private router: Router, 
    private cdr: ChangeDetectorRef,
    private toast: ToastrService
  ) {}

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

    // 🐛 Log pour déboguer : affiche les données envoyées
    console.log("Données envoyées au backend :", this.nouvelleFormation);
    console.log("Headers :", headers);

    if (this.enModeModification) {
      this.http.put(`${this.baseUrl}/${this.nouvelleFormation.id}`, this.nouvelleFormation, { headers }).subscribe({
        next: (reponse) => {
          console.log("Réponse backend :", reponse);
          this.toast.success("Formation mise à jour avec succès !", 'succes');
          this.afficherFormulaire = false; // Ferme la modale
          this.enModeModification = false;
          this.chargerFormations();        // Rafraîchit la liste
        },
        error: (err) => {
          console.error("❌ Erreur complète modification formation :", err);
          this.toast.error("Une erreur s'est produite lors de la mise à jour de la formation.", 'danger');
          console.error("Status :", err.status);
          console.error("Message :", err.message);
          // Forcer la fermeture du modal même en cas d'erreur
          this.basculerFormulaire();
        }
      });
    } else {
      this.http.post(this.baseUrl, this.nouvelleFormation, { headers }).subscribe({
        next: (reponse) => {
          console.log("✅ Réponse backend création :", reponse);
          this.toast.success("Formation enregistrée avec succès !", 'succes');
          this.afficherFormulaire = false; // Ferme la modale
          this.chargerFormations();        // Rafraîchit la liste
        },
        error: (err) => {
          console.error("❌ Erreur complète ajout formation :", err);
          this.toast.error("Une erreur s'est produite lors de l'enregistrement de la formation.", 'danger');
          console.error("Status HTTP :", err.status);
          console.error("Message :", err.message);
          if (err.error) console.error("Détails backend :", err.error);
          // Forcer la fermeture du modal même en cas d'erreur
          this.basculerFormulaire();
        }
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
          this.toast.success("Formation supprimée du système.", 'info'); 
          this.chargerFormations(); 
        },
        error: (err) => {
          console.error("Erreur suppression formation :", err);
          this.toast.error("Une erreur s'est produite lors de la suppression.", 'danger');
          console.error("Status :", err.status);
          console.error("Message :", err.message);
        }
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