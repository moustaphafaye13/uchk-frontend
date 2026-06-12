import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'; // 👈 Ajout de HttpParams ici
import { Router, RouterModule } from '@angular/router'; 
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-etudiants',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './etudiants.html'
})
export class EtudiantsComponent implements OnInit {
  listeEtudiants: any[] = [];
  afficherFormulaire: boolean = false;
  enModeModification: boolean = false;

  nouvelEtudiant: any = {
    ine: '',
    nom: '',
    prenom: '',
    email: '', // Conservé dans l'interface pour la saisie de l'admin
    formation: ''
  };

  constructor(
    private http: HttpClient, 
    private router: Router,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit() {
    this.chargerEtudiants();
  }

  // 1. CHARGEMENT DE LA LISTE
  chargerEtudiants() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/']);
      return;
    }

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<any[]>('http://localhost:8080/etudiants', { headers }).subscribe({
      next: (data) => {
        console.log("Étudiants reçus de la BDD :", data);
        this.listeEtudiants = data;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error("Erreur HTTP GET :", err);
        if (err.status === 401 || err.status === 403) this.onLogout();
      }
    });
  }

  basculerFormulaire() {
    this.afficherFormulaire = !this.afficherFormulaire;
    if (!this.afficherFormulaire) {
      this.annulerModification();
    }
    this.cdr.detectChanges();
  }

  ouvrirModificationEtudiant(etudiant: any) {
    // Si le serveur renvoie l'objet user associé, on pré-remplit l'adresse email
    const emailActuel = etudiant.user ? etudiant.user.username : '';
    
    this.nouvelEtudiant = { 
      ...etudiant,
      email: emailActuel // Alimente le champ du formulaire
    };
    this.enModeModification = true;
    this.afficherFormulaire = true; 
    this.cdr.detectChanges();
  }

  // 2. SOUMISSION DU FORMULAIRE (Ajout ou Modification)
  validerAjoutEtudiant(event: Event) {
    event.preventDefault();

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // 🚀 SÉPARATION LOGIQUE : L'email va dans les Query Params, le reste dans le Body JSON
    const emailSaisi = this.nouvelEtudiant.email;
    const params = new HttpParams().set('email', emailSaisi);

    const corpsEtudiant = {
      id: this.nouvelEtudiant.id,
      ine: this.nouvelEtudiant.ine,
      nom: this.nouvelEtudiant.nom,
      prenom: this.nouvelEtudiant.prenom,
      formation: this.nouvelEtudiant.formation
    };

    if (this.enModeModification) {
      // Mode modification -> Appelle update() avec le paramètre email
      this.http.put(`http://localhost:8080/etudiants/${this.nouvelEtudiant.id}`, corpsEtudiant, { headers, params }).subscribe({
        next: () => {
          alert("Fiche étudiant et identifiants modifiés avec succès !");
          this.basculerFormulaire(); 
          this.chargerEtudiants();   
        },
        error: (err) => console.error("Erreur HTTP PUT :", err)
      });
    } else {
      // Mode ajout -> Appelle save() en passant l'étudiant et l'email
      this.http.post('http://localhost:8080/etudiants', corpsEtudiant, { headers, params }).subscribe({
        next: (res) => {
          console.log("Étudiant enregistré automatiquement :", res);
          alert("Nouvel étudiant inscrit ! Son compte d'accès a été généré.");
          this.basculerFormulaire(); 
          this.chargerEtudiants();   
        },
        error: (err) => console.error("Erreur HTTP POST :", err)
      });
    }
  }

  // 3. SUPPRESSION
  supprimerEtudiant(id: number) {
    if (confirm('Voulez-vous vraiment désinscrire cet étudiant ?')) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

      this.http.delete(`http://localhost:8080/etudiants/${id}`, { headers }).subscribe({
        next: () => {
          alert("L'étudiant a été retiré.");
          this.chargerEtudiants();
        },
        error: (err) => console.error("Erreur HTTP DELETE :", err)
      });
    }
  }

  annulerModification() {
    this.nouvelEtudiant = { ine: '', nom: '', prenom: '', email: '', formation: '' };
    this.enModeModification = false;
  }

  exporterPDF() {
    window.print();
  }

  onLogout() {
    localStorage.removeItem('token');
    this.router.navigate(['/']);
  }
}