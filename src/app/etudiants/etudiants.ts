import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http'; 
import { Router, RouterModule } from '@angular/router'; 
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-etudiants',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './etudiants.html'
})
export class EtudiantsComponent implements OnInit {
  
  // 🧭 Contrôle de l'affichage de l'interface admin
  ongletActif: string = 'etudiants'; // 'etudiants' ou 'professeurs'

  // 👨‍🎓 Propriétés pour la gestion des Étudiants
  listeEtudiants: any[] = [];
  afficherFormulaire: boolean = false;
  enModeModification: boolean = false;
  nouvelEtudiant: any = { ine: '', nom: '', prenom: '', email: '', formation: '' };

  // 👨‍🏫 Propriétés pour la gestion des Professeurs
  listeProfesseurs: any[] = [];
  afficherFormulaireProf: boolean = false;
  enModeModificationProf: boolean = false;
  nouveauProfesseur: any = { codeMatricule: '', nom: '', prenom: '', email: '', specialite: '' };

  constructor(
    private http: HttpClient, 
    private router: Router,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit() {
    this.chargerEtudiants();
    this.chargerProfesseurs(); // Charge les données du corps enseignant au démarrage
  }

  // 🔄 Méthode pour basculer d'onglet facilement
  changerOnglet(onglet: string) {
    this.ongletActif = onglet;
    this.cdr.detectChanges();
  }

  // =========================================================================
  // SECTION 1 : LOGIQUE ÉTUDIANTS (Mise au propre JSON)
  // =========================================================================
  
  chargerEtudiants() {
    const token = localStorage.getItem('token');
    if (!token) { this.router.navigate(['/']); return; }
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<any[]>('http://localhost:8080/etudiants', { headers }).subscribe({
      next: (data) => {
        this.listeEtudiants = data;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error("Erreur HTTP GET Étudiants :", err);
        if (err.status === 401 || err.status === 403) this.onLogout();
      }
    });
  }

  basculerFormulaire() {
    this.afficherFormulaire = !this.afficherFormulaire;
    if (!this.afficherFormulaire) { this.annulerModification(); }
    this.cdr.detectChanges();
  }

  ouvrirModificationEtudiant(etudiant: any) {
    // Si l'étudiant a déjà un compte, on extrait l'identifiant pour pré-remplir le champ email
    const emailActuel = etudiant.user ? etudiant.user.username : (etudiant.email || '');
    this.nouvelEtudiant = { ...etudiant, email: emailActuel };
    this.enModeModification = true;
    this.afficherFormulaire = true; 
    this.cdr.detectChanges();
  }

  validerAjoutEtudiant(event: Event) {
    event.preventDefault();
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' });

    // ✨ ALIGNEMENT BACKEND : On intègre l'email directement dans le corps JSON principal
    const corpsEtudiant = {
      id: this.nouvelEtudiant.id,
      ine: this.nouvelEtudiant.ine,
      nom: this.nouvelEtudiant.nom,
      prenom: this.nouvelEtudiant.prenom,
      email: this.nouvelEtudiant.email, // Ajouté ici !
      formation: this.nouvelEtudiant.formation
    };

    if (this.enModeModification) {
      this.http.put(`http://localhost:8080/etudiants/${this.nouvelEtudiant.id}`, corpsEtudiant, { headers }).subscribe({
        next: () => {
          alert("🎉 Fiche étudiant et identifiants modifiés avec succès !");
          this.basculerFormulaire(); 
          this.chargerEtudiants();   
        },
        error: (err) => console.error("Erreur HTTP PUT Étudiant :", err)
      });
    } else {
      this.http.post('http://localhost:8080/etudiants', corpsEtudiant, { headers }).subscribe({
        next: (res) => {
          alert("🎉 Nouvel étudiant inscrit ! Son compte d'accès a été généré.");
          this.basculerFormulaire(); 
          this.chargerEtudiants();   
        },
        error: (err) => console.error("Erreur HTTP POST Étudiant :", err)
      });
    }
  }

  supprimerEtudiant(id: number) {
    if (confirm('Voulez-vous vraiment désinscrire cet étudiant ?')) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

      this.http.delete(`http://localhost:8080/etudiants/${id}`, { headers }).subscribe({
        next: () => {
          alert("L'étudiant a été retiré.");
          this.chargerEtudiants();
        },
        error: (err) => console.error("Erreur HTTP DELETE Étudiant :", err)
      });
    }
  }

  annulerModification() {
    this.nouvelEtudiant = { ine: '', nom: '', prenom: '', email: '', formation: '' };
    this.enModeModification = false;
  }

  // =========================================================================
  // SECTION 2 : LOGIQUE PROFESSEURS (Mise au propre JSON)
  // =========================================================================

  chargerProfesseurs() {
    const token = localStorage.getItem('token');
    if (!token) return;
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<any[]>('http://localhost:8080/professeurs', { headers }).subscribe({
      next: (data) => {
        this.listeProfesseurs = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Erreur HTTP GET Professeurs :", err)
    });
  }

  basculerFormulaireProf() {
    this.afficherFormulaireProf = !this.afficherFormulaireProf;
    if (!this.afficherFormulaireProf) { this.annulerModificationProf(); }
    this.cdr.detectChanges();
  }

  ouvrirModificationProfesseur(professeur: any) {
    const emailActuel = professeur.user ? professeur.user.username : (professeur.email || '');
    this.nouveauProfesseur = { ...professeur, email: emailActuel };
    this.enModeModificationProf = true;
    this.afficherFormulaireProf = true;
    this.cdr.detectChanges();
  }

  validerAjoutProfesseur(event: Event) {
    event.preventDefault();
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' });

    // ✨ ALIGNEMENT BACKEND : On intègre l'email directement dans le corps JSON principal
    const corpsProfesseur = {
      id: this.nouveauProfesseur.id,
      codeMatricule: this.nouveauProfesseur.codeMatricule,
      nom: this.nouveauProfesseur.nom,
      prenom: this.nouveauProfesseur.prenom,
      email: this.nouveauProfesseur.email, // Ajouté ici !
      specialite: this.nouveauProfesseur.specialite
    };

    if (this.enModeModificationProf) {
      this.http.put(`http://localhost:8080/professeurs/${this.nouveauProfesseur.id}`, corpsProfesseur, { headers }).subscribe({
        next: () => {
          alert("🎉 Fiche professeur et identifiants modifiés avec succès !");
          this.basculerFormulaireProf();
          this.chargerProfesseurs();
        },
        error: (err) => console.error("Erreur HTTP PUT Professeur :", err)
      });
    } else {
      this.http.post('http://localhost:8080/professeurs', corpsProfesseur, { headers }).subscribe({
        next: (res) => {
          alert("🎉 Nouveau professeur enregistré ! Son compte d'accès a été généré.");
          this.basculerFormulaireProf();
          this.chargerProfesseurs();
        },
        error: (err) => console.error("Erreur HTTP POST Professeur :", err)
      });
    }
  }

  supprimerProfesseur(id: number) {
    if (confirm('Voulez-vous vraiment retirer ce professeur du système ?')) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

      this.http.delete(`http://localhost:8080/professeurs/${id}`, { headers }).subscribe({
        next: () => {
          alert("Le professeur a été retiré.");
          this.chargerProfesseurs();
        },
        error: (err) => console.error("Erreur HTTP DELETE Professeur :", err)
      });
    }
  }

  annulerModificationProf() {
    this.nouveauProfesseur = { codeMatricule: '', nom: '', prenom: '', email: '', specialite: '' };
    this.enModeModificationProf = false;
  }

  // =========================================================================
  // ACTIONS GLOBALES
  // =========================================================================

  exporterPDF() {
    window.print();
  }

  onLogout() {
    localStorage.removeItem('token');
    this.router.navigate(['/']);
  }
}