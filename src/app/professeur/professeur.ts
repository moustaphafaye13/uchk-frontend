import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-professeur',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './professeur.html'
})
export class ProfesseurComponent implements OnInit {
  ongletActif: string = 'cours';

  listeEtudiants: any[] = []; 
  listeCours: any[] = []; 
  listeEDT: any[] = []; // 🌟 Contient dynamiquement l'emploi du temps réel du backend
  
  // 🌟 Modèle d'objet Cours mis à jour avec la séparation Document et Vidéo
  nouveauCours: any = { 
    intitule: '', 
    code: '', 
    description: '', 
    formation: '', 
    credits: 6,
    documentSelectionne: null,    // Pour le fichier écrit (PDF/Word)
    lienVideo: '',                // Pour le lien URL externe (YouTube/Drive)
    videoSelectionnee: null       // Pour le fichier physique (.mp4)
  };
  coursEnEdition: any = null;

  // 🌟 Modèle réadapté pour correspondre à l'entité EmploiDuTemps de ton backend
  nouvelEDT: any = {
    jour: 'Lundi',
    heureDebut: '',
    heureFin: '',
    salle: '',
    cours: null // Contiendra l'objet cours complet sélectionné par le prof
  };

  noteSaisie: any = {
    etudiant: undefined, 
    cours: undefined,    
    valeur: null,
    semestre: 'Semestre 1',
    appreciation: ''
  };

  messageSucces: string = '';
  messageErreur: string = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.initialiserDonnees();
    this.chargerEmploiDuTemps(); // 🌟 Chargement automatique du planning au démarrage
  }

  changerOnglet(onglet: string) {
    this.ongletActif = onglet;
    this.messageSucces = '';
    this.messageErreur = '';
  }

  initialiserDonnees() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/']);
      return;
    }

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<any[]>('http://localhost:8080/etudiants', { headers }).subscribe({
      next: (data) => { 
        this.listeEtudiants = data; 
        this.cdr.detectChanges(); 
      },
      error: (err) => console.error("Erreur chargement étudiants", err)
    });

    this.http.get<any[]>('http://localhost:8080/cours', { headers }).subscribe({
      next: (data) => { 
        this.listeCours = data; 
        this.cdr.detectChanges(); 
      },
      error: (err) => console.error("Erreur chargement cours", err)
    });
  }

  // 🌟 Récupération globale de l'emploi du temps depuis l'API Spring Boot
  chargerEmploiDuTemps() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<any[]>('http://localhost:8080/api/emploi-du-temps', { headers }).subscribe({
      next: (data) => {
        this.listeEDT = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Erreur lors de la récupération de l'EDT", err)
    });
  }

  // 🌟 Intercepte le document de cours écrit (PDF, Word...)
  onDocumentChange(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.nouveauCours.documentSelectionne = event.target.files[0];
    }
  }

  // 🎥 Intercepte la vidéo explicative physique (.mp4)
  onVideoPhysiqueChange(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.nouveauCours.videoSelectionnee = event.target.files[0];
    }
  }

  // ================= 📚 MODULE 1 : GESTION DES COURS =================
  ajouterOuModifierCours() {
    this.messageSucces = '';
    this.messageErreur = '';
    
    const token = localStorage.getItem('token');
    
    if (this.coursEnEdition && this.coursEnEdition.id) {
      // ✏️ MODE MODIFICATION (PUT) - Envoi JSON
      const headersJson = new HttpHeaders({ 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      const bodyPayload = {
        code: String(this.nouveauCours.code).trim(),
        intitule: String(this.nouveauCours.intitule).trim(),
        description: String(this.nouveauCours.description || '').trim(),
        formation: String(this.nouveauCours.formation || '').trim(),
        credits: Number(this.nouveauCours.credits) || 6,
        lienSupport: this.nouveauCours.lienSupport,
        lienVideo: this.nouveauCours.lienVideo
      };
      
      const idCours = this.coursEnEdition.id;
      
      this.http.put(`http://localhost:8080/cours/${idCours}`, bodyPayload, { headers: headersJson }).subscribe({
        next: () => {
          this.messageSucces = `Le cours "${bodyPayload.intitule}" a été mis à jour avec succès !`;
          this.reinitialiserFormulaireCours();
          this.initialiserDonnees();
        },
        error: (err) => {
          console.error("Détails erreur modification :", err);
          this.messageErreur = "Le serveur a refusé la mise à jour.";
          this.cdr.detectChanges();
        }
      });
    } else {
      // ➕ MODE CRÉATION (POST) - Envoi Multipart FormData
      const headersMultipart = new HttpHeaders({ 
        'Authorization': `Bearer ${token}`
      });

      const formDataPayload = new FormData();
      formDataPayload.append('code', String(this.nouveauCours.code || '').trim());
      formDataPayload.append('intitule', String(this.nouveauCours.intitule || '').trim());
      formDataPayload.append('description', String(this.nouveauCours.description || '').trim());
      formDataPayload.append('formation', String(this.nouveauCours.formation || '').trim());
      formDataPayload.append('credits', String(this.nouveauCours.credits || 6));
      
      if (this.nouveauCours.documentSelectionne) {
        formDataPayload.append('fichierDocument', this.nouveauCours.documentSelectionne);
      }
      
      if (this.nouveauCours.lienVideo) {
        formDataPayload.append('lienVideo', this.nouveauCours.lienVideo);
      }
      
      if (this.nouveauCours.videoSelectionnee) {
        formDataPayload.append('fichierVideo', this.nouveauCours.videoSelectionnee);
      }

      this.http.post('http://localhost:8080/cours', formDataPayload, { headers: headersMultipart }).subscribe({
        next: () => {
          this.messageSucces = "Nouvelle matière créée avec succès avec son document écrit ET sa vidéo explicative !";
          this.reinitialiserFormulaireCours();
          this.initialiserDonnees();
        },
        error: (err) => {
          console.error("Détails erreur création:", err);
          this.messageErreur = "Impossible de créer le cours. Vérifie la console du serveur.";
          this.cdr.detectChanges();
        }
      });
    }
  }

  chargerPourModifier(cours: any) {
    if (!cours || !cours.id) {
      this.messageErreur = "Impossible de charger une structure de données sans identifiant valide.";
      return;
    }
    this.coursEnEdition = cours;
    this.nouveauCours = { 
      ...cours, 
      lienVideo: cours.lienVideo || '', 
      documentSelectionne: null,
      videoSelectionnee: null 
    };
    this.messageSucces = `Matière [${cours.code}] chargée dans le formulaire d'édition.`;
    this.cdr.detectChanges();
  }

  supprimerCours(id: number) {
    if (!id) {
      this.messageErreur = "Action annulée : Ce cours ne possède pas d'identifiant unique en base de données.";
      return;
    }

    if (confirm("Voulez-vous vraiment supprimer définitivement ce cours ?")) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

      this.http.delete(`http://localhost:8080/cours/${id}`, { headers }).subscribe({
        next: () => {
          this.messageSucces = "Le cours a été supprimé avec succès de la base de données.";
          if (this.coursEnEdition && this.coursEnEdition.id === id) {
            this.reinitialiserFormulaireCours();
          }
          this.initialiserDonnees();
        },
        error: (err) => {
          console.error("Détails erreur suppression :", err);
          this.messageErreur = "Erreur de suppression (404 ou contrainte d'intégrité si des notes y sont liées).";
          this.cdr.detectChanges();
        }
      });
    }
  }

  reinitialiserFormulaireCours() {
    this.nouveauCours = { 
      intitule: '', 
      code: '', 
      description: '', 
      formation: '', 
      credits: 6, 
      documentSelectionne: null, 
      lienVideo: '', 
      videoSelectionnee: null 
    };
    this.coursEnEdition = null;
  }

  // ================= 📅 MODULE 2 : PLANIFICATION EMPLOI DU TEMPS REAL-TIME =================
  planifierEDT() {
    this.messageSucces = '';
    this.messageErreur = '';

    if (!this.nouvelEDT.cours || !this.nouvelEDT.heureDebut || !this.nouvelEDT.heureFin || !this.nouvelEDT.salle) {
      this.messageErreur = "Veuillez remplir l'ensemble des champs (Matière, horaires et salle) avant de valider.";
      return;
    }

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // Envoi de la planification au contrôleur Spring Boot
    this.http.post('http://localhost:8080/api/emploi-du-temps/planifier', this.nouvelEDT, { headers }).subscribe({
      next: (data: any) => {
        this.messageSucces = `Le cours de "${this.nouvelEDT.cours.intitule}" a été planifié pour le ${this.nouvelEDT.jour} !`;
        // Réinitialisation du formulaire en conservant une structure saine
        this.nouvelEDT = { jour: 'Lundi', heureDebut: '', heureFin: '', salle: '', cours: null };
        this.chargerEmploiDuTemps(); // Rechargement de la liste de droite
      },
      error: (err) => {
        console.error("Erreur planification EDT:", err);
        this.messageErreur = "Impossible d'enregistrer le planning. Vérifiez les liaisons d'entités du backend.";
        this.cdr.detectChanges();
      }
    });
  }

  // ================= 📅 MODULE 3 : EVALUATION / ENREGISTRER NOTE =================
  enregistrerNote(event: Event) {
    event.preventDefault();
    
    this.messageSucces = '';
    this.messageErreur = '';

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 
      'Authorization': `Bearer ${token}` 
    });

    const etudiantIdBrut = this.noteSaisie.etudiant && typeof this.noteSaisie.etudiant === 'object' 
      ? this.noteSaisie.etudiant.id 
      : this.noteSaisie.etudiant;

    const coursIdBrut = this.noteSaisie.cours && typeof this.noteSaisie.cours === 'object' 
      ? this.noteSaisie.cours.id 
      : this.noteSaisie.cours;

    if (!etudiantIdBrut || !coursIdBrut) {
      this.messageErreur = "Veuillez sélectionner un étudiant et une Unité d'Enseignement.";
      return;
    }

    const formData = new FormData();
    formData.append('valeur', String(this.noteSaisie.valeur));
    formData.append('semestre', this.noteSaisie.semestre);
    formData.append('appreciation', this.noteSaisie.appreciation);
    formData.append('etudiantId', String(etudiantIdBrut)); 
    formData.append('coursId', String(coursIdBrut));        

    this.http.post('http://localhost:8080/notes/saisir', formData, { headers }).subscribe({
      next: () => {
        this.messageSucces = "La note a été publiée avec succès !";
        this.noteSaisie = { etudiant: undefined, cours: undefined, valeur: null, semestre: 'Semestre 1', appreciation: '' };
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Détails erreur note:", err);
        this.messageErreur = "Erreur lors de la publication de la note. Vérifiez les champs ou la console serveur.";
        this.cdr.detectChanges();
      }
    });
  }

  deconnecter() {
    localStorage.removeItem('token');
    this.router.navigate(['/']);
  }
}