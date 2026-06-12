import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router'; 
import { FormsModule } from '@angular/forms'; 

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
  listeCoursBdd: any[] = []; // Contient dynamiquement les attributs lienSupport et lienVideo
  emploisDuTemps: any[] = []; // 🌟 Initialisé à vide pour accueillir les données réelles du serveur
  chargement: boolean = true;
  messageErreur: string = '';

  // ⚙️ Variables pour le module de modification de profil
  nouvelEmail: string = '';
  ancienMotDePasse: string = '';
  nouveauMotDePasse: string = '';
  messageSuccesModif: string = '';
  messageErreurModif: string = '';

  // 📁 Données d'accès aux ressources et documents administratives (statiques)
  ressources: any[] = [
    { titre: 'Support de cours - Architecture Logicielle.pdf', type: 'PDF', taille: '3.5 Mo' },
    { titre: 'TP 1 - Configuration Environnement Angular.zip', type: 'Archive', taille: '1.8 Mo' },
    { titre: 'Circulaire de préparation aux examens de fin de semestre.pdf', type: 'PDF', taille: '512 Ko' }
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.chargerProfilEtudiant();
    this.chargerTousLesCours(); 
    this.chargerEmploiDuTemps(); // 🌟 Lancement automatique de la récupération de l'emploi du temps
  }

  // 🌟 Gère le changement d'onglet à l'écran
  changerOnglet(nouveauOnglet: string) {
    this.ongletActif = nouveauOnglet;
    this.messageSuccesModif = '';
    this.messageErreurModif = '';
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
        this.nouvelEmail = data.email; 
        
        // 2. Une fois le profil chargé, on récupère dynamiquement ses notes
        this.chargerNotesEtudiant(usernameConnecte, headers);
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
    this.http.get<any[]>(`http://localhost:8080/notes/mes-notes/${email}`, { headers }).subscribe({
      next: (notes) => {
        console.log("Notes récupérées :", notes);
        this.listeNotes = notes; 
        this.chargement = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error("Erreur lors du chargement des notes :", err);
        this.chargement = false;
        this.cdr.detectChanges();
      }
    });
  }

  // 🌟 Récupération des cours ajoutés par le professeur avec les nouveaux liens supports et vidéos
  chargerTousLesCours() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<any[]>('http://localhost:8080/cours', { headers }).subscribe({
      next: (data) => {
        console.log("Cours récupérés pour l'étudiant depuis la BDD :", data);
        this.listeCoursBdd = data; 
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error("Erreur lors de la récupération des cours pour l'étudiant :", err);
      }
    });
  }

  // 🌟 Nouvelle méthode pour récupérer l'emploi du temps dynamique depuis la base de données
  chargerEmploiDuTemps() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<any[]>('http://localhost:8080/api/emploi-du-temps', { headers }).subscribe({
      next: (data) => {
        console.log("Emploi du temps réel chargé :", data);
        this.emploisDuTemps = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Erreur lors de la récupération de l'emploi du temps :", err);
      }
    });
  }

  // 📝 Méthode pour le module de modification de l'adresse email
  mettreAJourEmail() {
    this.messageSuccesModif = '';
    this.messageErreurModif = '';
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    
    this.http.put(`http://localhost:8080/etudiants/${this.profilEtudiant.id}/modifier-email`, { email: this.nouvelEmail }, { headers }).subscribe({
      next: () => {
        this.messageSuccesModif = "Votre adresse email a été mise à jour avec succès !";
        this.profilEtudiant.email = this.nouvelEmail;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.messageErreurModif = "Une erreur est survenue lors de la modification de l'email.";
      }
    });
  }

  // 🔒 Méthode pour le module de modification du mot de passe
  mettreAJourMotDePasse() {
    this.messageSuccesModif = '';
    this.messageErreurModif = '';
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    const body = { 
      ancienPassword: this.ancienMotDePasse, 
      nouveauPassword: this.nouveauMotDePasse 
    };
    
    this.http.put(`http://localhost:8080/etudiants/${this.profilEtudiant.id}/modifier-password`, body, { headers }).subscribe({
      next: () => {
        this.messageSuccesModif = "Votre mot de passe a été modifié avec succès !";
        this.ancienMotDePasse = '';
        this.nouveauMotDePasse = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.messageErreurModif = "Impossible de modifier le mot de passe. Vérifiez votre ancien mot de passe.";
      }
    });
  }

  deconnecter() {
    localStorage.removeItem('token');
    this.router.navigate(['/']);
  }
}