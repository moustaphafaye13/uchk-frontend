import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router'; 
import { FormsModule } from '@angular/forms'; 
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-espace-etudiant',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './espace-etudiant.html'
})
export class EspaceEtudiantComponent implements OnInit {
  // 🌟 Navigation : Contrôle de l'onglet actif
  ongletActif: string = 'tableau-de-bord';

  profilEtudiant: any = null;
  listeNotes: any[] = []; 
  listeCoursBdd: any[] = []; // Contient dynamiquement les cours du programme de l'étudiant
  emploisDuTemps: any[] = []; 
  chargement: boolean = true;
  messageErreur: string = '';

  // ⚙️ Variables pour le module de modification de profil
  nouveauNom: string = '';
  nouveauPrenom: string = '';
  ancienMotDePasse: string = '';
  nouveauMotDePasse: string = '';

  // 📁 Données d'accès aux ressources et documents administratifs (statiques)
  ressources: any[] = [
    { titre: 'Support de cours - Architecture Logicielle.pdf', type: 'PDF', taille: '3.5 Mo' },
    { titre: 'TP 1 - Configuration Environnement Angular.zip', type: 'Archive', taille: '1.8 Mo' },
    { titre: 'Circulaire de préparation aux examens de fin de semestre.pdf', type: 'PDF', taille: '512 Ko' }
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toast: ToastrService
  ) {}

  ngOnInit() {
    this.chargerProfilEtudiant();
  }

  // 🌟 Gère le changement d'onglet à l'écran
  changerOnglet(nouveauOnglet: string) {
    this.ongletActif = nouveauOnglet;
    this.cdr.detectChanges();
  }

  chargerProfilEtudiant() {
    const token = localStorage.getItem('token');
    
    if (!token) {
      this.router.navigate(['/']);
      return;
    }

    // Décoder le token JWT pour récupérer l'email de l'étudiant connecté
    const payload = JSON.parse(atob(token.split('.')[1]));
    const usernameConnecte = payload.sub; 

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // 1. Appel pour charger le profil académique de l'étudiant connecté
    this.http.get<any>(`http://localhost:8080/etudiants/profil-etudiant/${usernameConnecte}`, { headers }).subscribe({
      next: (data) => {
        console.log("Profil étudiant chargé :", data);
        this.profilEtudiant = data; 
        this.nouveauNom = data.nom || '';
        this.nouveauPrenom = data.prenom || '';
        
        // 2. Chargement des données dépendantes du profil de l'étudiant
        this.chargerNotesEtudiant(usernameConnecte, headers);
        this.chargerTousLesCours(headers); 
        this.chargerEmploiDuTemps(headers); 
      },
      error: (err) => {
        console.error("Erreur lors du chargement du profil :", err);
        this.messageErreur = "Impossible de charger votre profil académique.";
        this.chargement = false;
        this.cdr.detectChanges();
      }
    });
  }

  chargerNotesEtudiant(email: string, headers: HttpHeaders) {
    this.http.get<any>(`http://localhost:8080/notes/mes-notes-etudiant/${email}`, { headers }).subscribe({
      next: (response) => {
        if (response.success && response.notes) {
          this.listeNotes = response.notes; 
        } else {
          this.listeNotes = [];
        }
        this.chargement = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error("Erreur lors du chargement des notes :", err);
        this.listeNotes = [];
        this.chargement = false;
        this.cdr.detectChanges();
      }
    });
  }

  // 🌟 Récupération des cours filtrés par la formation de l'étudiant
  chargerTousLesCours(headers: HttpHeaders) {
    // Utiliser l'ID de la formation de l'étudiant pour récupérer SEULEMENT les cours de sa formation
    if (this.profilEtudiant && this.profilEtudiant.formation && this.profilEtudiant.formation.id) {
      this.http.get<any>(`http://localhost:8080/cours/formation/${this.profilEtudiant.formation.id}`, { headers }).subscribe({
        next: (data) => {
          // Le backend retourne { success: true, cours: [tableau des cours] }, on extrait le tableau
          this.listeCoursBdd = data.cours || []; 
          console.log("Cours récupérés pour la formation :", this.listeCoursBdd);
          
          this.cdr.detectChanges(); 
        },
        error: (err) => {
          console.error("Erreur lors de la récupération des cours filtrés par formation :", err);
        }
      });
    } else {
      console.warn("Impossible de charger les cours : formation non définie pour l'étudiant");
      this.listeCoursBdd = [];
    }
  }

  // 🌟 Récupération de l'emploi du temps dynamique
  chargerEmploiDuTemps(headers: HttpHeaders) {
    // Récupérer d'abord le username depuis le token pour appeler l'endpoint étudiant
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/']);
      return;
    }
    const payload = JSON.parse(atob(token.split('.')[1]));
    const usernameConnecte = payload.sub;
    
    this.http.get<any>(`http://localhost:8080/api/emploi-du-temps/mes-seances/${usernameConnecte}`, { headers }).subscribe({
      next: (response) => {
        if (response.success && response.seances) {
          this.emploisDuTemps = response.seances;
        } else {
          this.emploisDuTemps = [];
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Erreur lors de la récupération de l'emploi du temps :", err);
        this.emploisDuTemps = [];
        this.cdr.detectChanges();
      }
    });
  }

  // 📝 Modification du nom et prénom
  mettreAJourNomPrenom() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const body = { 
      nom: this.nouveauNom,
      prenom: this.nouveauPrenom
    };
    
    this.http.put<any>(`http://localhost:8080/etudiants/${this.profilEtudiant.id}/modifier-nom-prenom`, body, { headers }).subscribe({
      next: (response) => {
        if (response.success) {
          this.toast.success("Votre nom et prénom ont été mis à jour avec succès !", 'Succès');
        }
        this.nouveauNom = '';
        this.nouveauPrenom = '';
        this.cdr.detectChanges();
        this.chargerProfilEtudiant(); // Recharger complètement le profil
      },
      error: (err) => {
        console.error(err);
        this.toast.error(err.error?.message || "Une erreur est survenue lors de la modification du nom et prénom.", 'Erreur');
      }
    });
  }

  // 🔒 Modification du mot de passe
  mettreAJourMotDePasse() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const body = { 
      ancienPassword: this.ancienMotDePasse, 
      nouveauPassword: this.nouveauMotDePasse 
    };
    
    this.http.put<any>(`http://localhost:8080/etudiants/${this.profilEtudiant.id}/modifier-password`, body, { headers }).subscribe({
      next: (response) => {
        if (response.success) {
          this.toast.success("Votre mot de passe a été modifié avec succès !", 'Succès');
        }
        this.ancienMotDePasse = '';
        this.nouveauMotDePasse = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.toast.error(err.error?.message || "Impossible de modifier le mot de passe. Vérifiez votre ancien mot de passe.", 'Erreur');
      }
    });
  }

  deconnecter() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    this.router.navigate(['/']);
  }
}