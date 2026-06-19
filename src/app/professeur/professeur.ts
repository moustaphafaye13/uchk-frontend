import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

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
  listeEDT: any[] = []; // Contient dynamiquement l'emploi du temps réel du backend
  listeNotes: any[] = []; // Contient les notes saisies par le professeur

  // Modèle d'objet Cours mis à jour avec la séparation Document et Vidéo
  nouveauCours: any = { 
    intitule: '', 
    code: '', 
    description: '', 
    credits: 6,
    documentSelectionne: null,    // Pour le fichier écrit (PDF/Word)
    lienVideo: '',                // Pour le lien URL externe (YouTube/Drive)
    videoSelectionnee: null       // Pour le fichier physique (.mp4)
  };
  coursEnEdition: any = null;
  afficherFormulaireCours: boolean = false;

  // Propriétés pour les modals d'activités (EDT)
  afficherFormulaireEDT: boolean = false;
  edtEnEdition: any = null;

  // Propriétés pour les modals de suivi (notes)
  afficherFormulaireNote: boolean = false;
  noteEnEdition: any = null;

  // Modèle réadapté pour correspondre à l'entité EmploiDuTemps du backend
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

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.initialiserDonnees();
    this.chargerEmploiDuTemps(); // 📅 Chargement automatique du planning au démarrage
    this.chargerNotes(); // 📝 Chargement automatique des notes au démarrage
  }

  changerOnglet(onglet: string) {
    this.ongletActif = onglet;
  }

  // 🎯 Méthodes de basculement des modales (cohérentes avec admin.ts)
  basculerFormulaireCours() {
    this.afficherFormulaireCours = !this.afficherFormulaireCours;
    if (!this.afficherFormulaireCours) { this.reinitialiserFormulaireCours(); }
    this.cdr.detectChanges();
  }

  basculerFormulaireEDT() {
    this.afficherFormulaireEDT = !this.afficherFormulaireEDT;
    if (!this.afficherFormulaireEDT) { this.reinitialiserFormulaireEDT(); }
    this.cdr.detectChanges();
  }

  basculerFormulaireNote() {
    this.afficherFormulaireNote = !this.afficherFormulaireNote;
    if (!this.afficherFormulaireNote) { this.reinitialiserFormulaireNote(); }
    this.cdr.detectChanges();
  }

  initialiserDonnees() {
    const token = localStorage.getItem('token');
    const emailProf = localStorage.getItem('username'); // Récupération du username du prof connecté
    
    if (!token) {
      this.router.navigate(['/']);
      return;
    }

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    // On charge uniquement les cours DU PROFESSEUR CONNECTÉ
    if (emailProf) {
      // 1. RÉCUPÉRER D'ABORD LE PROFIL DU PROFESSEUR pour avoir sa formation
      this.http.get<any>(`http://localhost:8080/professeurs/profil-professeur/${emailProf}`, { headers }).subscribe({
        next: (professeur: any) => {
          // 2. CHARGER SEULEMENT LES ÉTUDIANTS DE LA MÊME FORMATION QUE LE PROFESSEUR
          if (professeur && professeur.formation) {
            this.http.get<any[]>(`http://localhost:8080/etudiants/formation/${professeur.formation.id}`, { headers }).subscribe({
              next: (data) => { 
                this.listeEtudiants = data; 
                this.cdr.detectChanges(); 
              },
              error: (err) => {
                console.error("Erreur chargement étudiants de la formation", err);
                this.listeEtudiants = [];
              }
            });
          } else {
            this.listeEtudiants = [];
            this.toastr.warning("Vous n'êtes associé à aucune formation, aucun étudiant ne sera chargé.", 'Information');
          }

          // 3. PUIS CHARGER LES COURS DU PROFESSEUR
          this.http.get<any>(`http://localhost:8080/cours/mes-cours/${emailProf}`, { headers }).subscribe({
            next: (response) => { 
              if (response.success) {
                this.listeCours = response.cours; 
              } else {
                this.toastr.error(response.message || "Erreur lors du chargement des cours", 'Erreur');
                this.listeCours = [];
              }
              this.cdr.detectChanges(); 
            },
            error: (err) => {
              console.error("Erreur chargement des cours filtrés", err);
              this.listeCours = [];
            }
          });
        },
        error: (err) => {
          console.error("Erreur chargement du profil professeur", err);
          this.listeEtudiants = [];
        }
      });
    }
  }

  // 📅 Récupération exclusive de l'emploi du temps du prof connecté
  chargerEmploiDuTemps() {
    const token = localStorage.getItem('token');
    const emailProf = localStorage.getItem('username'); // 👈 Récupération du prof connecté
    
    if (!token) return;

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    if (emailProf) {
      this.http.get<any[]>(`http://localhost:8080/api/emploi-du-temps/mon-planning/${emailProf}`, { headers }).subscribe({
        next: (data) => {
          this.listeEDT = data;
          this.cdr.detectChanges();
        },
        error: (err) => console.error("Erreur lors de la récupération de l'EDT filtré", err)
      });
    }
  }

  // Intercepte le document de cours écrit (PDF, Word...)
  onDocumentChange(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.nouveauCours.documentSelectionne = event.target.files[0];
    }
  }

  // Intercepte la vidéo explicative physique (.mp4)
  onVideoPhysiqueChange(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.nouveauCours.videoSelectionnee = event.target.files[0];
    }
  }

  // ================= 📚 MODULE 1 : GESTION DES COURS =================
  ajouterOuModifierCours() {
    const token = localStorage.getItem('token');
    const emailProf = localStorage.getItem('username') || ''; 
    
    // ✅ VALIDATION PREALABLE DES CHAMPS OBLIGATOIRES
    const code = String(this.nouveauCours.code || '').trim();
    const intitule = String(this.nouveauCours.intitule || '').trim();
    const credits = Number(this.nouveauCours.credits) || 0;
    
    if (!code || !intitule || credits <= 0) {
      this.toastr.error("Veuillez remplir tous les champs obligatoires (Code, Intitulé et Crédits).", 'Erreur de saisie');
      return;
    }
    
    if (this.coursEnEdition && this.coursEnEdition.id) {
      // ✏️ MODE MODIFICATION (PUT) -> Reste en JSON comme ton Java attend sur son @PutMapping
      const headersJson = new HttpHeaders({ 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      const bodyPayload = {
        code: String(this.nouveauCours.code).trim(),
        intitule: String(this.nouveauCours.intitule).trim(),
        description: String(this.nouveauCours.description || '').trim(),
        credits: Number(this.nouveauCours.credits) || 6,
        lienVideo: this.nouveauCours.lienVideo ? String(this.nouveauCours.lienVideo).trim() : ''
      };
      
      const idCours = this.coursEnEdition.id;
      
      this.http.put<any>(`http://localhost:8080/cours/${idCours}`, bodyPayload, { headers: headersJson }).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastr.success(response.message || `Le cours "${bodyPayload.intitule}" a été mis à jour avec succès !`, 'Succès');
            this.reinitialiserFormulaireCours();
            this.initialiserDonnees();
            this.cdr.detectChanges();
          } else {
            this.toastr.error(response.message || "Erreur lors de la mise à jour", 'Erreur');
          }
        },
        error: (err) => {
          console.error("Détails erreur modification :", err);
          let messageErreur = "Le serveur a refusé la mise à jour.";
          if (err.status === 400) messageErreur = "Données invalides : vérifiez les champs du formulaire.";
          if (err.status === 401) messageErreur = "Session expirée : veuillez vous reconnecter.";
          if (err.status === 404) messageErreur = "Le cours à modifier n'existe plus sur le serveur.";
          if (err.status === 500) messageErreur = "Erreur interne du serveur : contactez l'administrateur.";
          this.toastr.error(messageErreur, 'Erreur');
          this.cdr.detectChanges();
        }
      });
    } else {
      // ➕ MODE CRÉATION (POST) -> Reconstruit en FormData (Multipart) pour correspondre au @PostMapping de Java
      const headersMultipart = new HttpHeaders({ 
        'Authorization': `Bearer ${token}`
      });

      const formDataPayload = new FormData();
      formDataPayload.append('code', String(this.nouveauCours.code || '').trim());
      formDataPayload.append('intitule', String(this.nouveauCours.intitule || '').trim());
      formDataPayload.append('description', String(this.nouveauCours.description || '').trim());
      formDataPayload.append('credits', String(this.nouveauCours.credits || 6));
      formDataPayload.append('emailProf', emailProf); 
      
      // Gestion obligatoire des objets fichiers pour ne pas manquer de @RequestParam côté Java
      if (this.nouveauCours.documentSelectionne) {
        formDataPayload.append('fichierDocument', this.nouveauCours.documentSelectionne);
      } else {
        formDataPayload.append('fichierDocument', new Blob(), ''); 
      }
      
      formDataPayload.append('lienVideo', String(this.nouveauCours.lienVideo || '').trim());
      
      if (this.nouveauCours.videoSelectionnee) {
        formDataPayload.append('fichierVideo', this.nouveauCours.videoSelectionnee);
      } else {
        formDataPayload.append('fichierVideo', new Blob(), ''); 
      }

      this.http.post<any>('http://localhost:8080/cours', formDataPayload, { headers: headersMultipart }).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastr.success(response.message || `La matière "${this.nouveauCours.intitule}" a été créée avec succès !`, 'Succès');
            this.reinitialiserFormulaireCours();
            this.initialiserDonnees();
          } else {
            this.toastr.error(response.message || "Erreur lors de la création du cours", 'Erreur');
          }
        },
        error: (err) => {
          console.error("Détails erreur création:", err);
          let messageErreur = "Impossible de créer le cours. Vérifiez les données du formulaire.";
          if (err.status === 400) messageErreur = "Données invalides : un cours avec ce code existe déjà ou les champs sont incomplets.";
          if (err.status === 401) messageErreur = "Session expirée : veuillez vous reconnecter.";
          if (err.status === 500) messageErreur = "Erreur interne du serveur : contactez l'administrateur.";
          this.toastr.error(messageErreur, 'Erreur');
          this.cdr.detectChanges();
        }
      });
    }
  }

  chargerPourModifier(cours: any) {
    if (!cours || !cours.id) {
      this.toastr.error("Impossible de charger une structure de données sans identifiant valide.", 'Erreur');
      return;
    }
    this.coursEnEdition = cours;
    this.nouveauCours = { 
      ...cours, 
      lienVideo: cours.lienVideo || '', 
      documentSelectionne: null,
      videoSelectionnee: null 
    };
    this.basculerFormulaireCours();
    this.toastr.info(`Matière [${cours.code}] chargée dans le formulaire d'édition.`, 'Information');
    this.cdr.detectChanges();
  }

  supprimerCours(id: number) {
    if (!id) {
      this.toastr.error("Action annulée : Ce cours ne possède pas d'identifiant unique en base de données.", 'Erreur');
      return;
    }

    if (confirm("Voulez-vous vraiment supprimer définitivement ce cours ?")) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

      this.http.delete<any>(`http://localhost:8080/cours/${id}`, { headers }).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastr.success(response.message || "Le cours a été supprimé avec succès de la base de données.", 'Information');
            if (this.coursEnEdition && this.coursEnEdition.id === id) {
              this.reinitialiserFormulaireCours();
            }
            this.initialiserDonnees();
          } else {
            this.toastr.error(response.message || "Erreur lors de la suppression", 'Erreur');
          }
        },
        error: (err) => {
          console.error("Détails erreur suppression :", err);
          this.toastr.error("Erreur de suppression (404 ou contrainte d'intégrité si des notes y sont liées).", 'Erreur');
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
      credits: 6, 
      documentSelectionne: null, 
      lienVideo: '', 
      videoSelectionnee: null 
    };
    this.coursEnEdition = null;
    this.afficherFormulaireCours = false;
  }

  // Méthodes pour gérer le formulaire EDT (activités)
  reinitialiserFormulaireEDT() {
    this.nouvelEDT = {
      jour: 'Lundi',
      heureDebut: '',
      heureFin: '',
      salle: '',
      cours: null
    };
    this.edtEnEdition = null;
    this.afficherFormulaireEDT = false;
  }

  chargerPourModifierEDT(edt: any) {
    if (!edt || !edt.id) {
      this.toastr.error("Impossible de charger une séance sans identifiant valide.", 'Erreur');
      return;
    }
    this.edtEnEdition = edt;
    this.nouvelEDT = { ...edt };
    this.afficherFormulaireEDT = true;
    this.toastr.info(`Séance [${edt.cours?.code}] chargée dans le formulaire d'édition.`, 'Information');
    this.cdr.detectChanges();
  }

  supprimerEDT(id: number) {
    if (!id) {
      this.toastr.error("Action annulée : Cette séance ne possède pas d'identifiant unique.", 'Erreur');
      return;
    }

    if (confirm("Voulez-vous vraiment supprimer définitivement cette séance de l'emploi du temps ?")) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

      this.http.delete(`http://localhost:8080/api/emploi-du-temps/${id}`, { headers }).subscribe({
        next: () => {
          this.toastr.info("La séance a été supprimée avec succès de l'emploi du temps.", 'Information');
          if (this.edtEnEdition && this.edtEnEdition.id === id) {
            this.reinitialiserFormulaireEDT();
          }
          // Rafraîchir l'agenda et forcer la détection de changements
          this.chargerEmploiDuTemps();
          setTimeout(() => {
            this.cdr.detectChanges();
          }, 100);
        },
        error: (err) => {
          console.error("Détails erreur suppression séance :", err);
          
          // Si la séance n'existe plus (404), rafraîchir l'affichage
          if (err.status === 404) {
            this.toastr.info("La séance n'existe plus, l'agenda est rafraîchi.", 'Information');
            this.chargerEmploiDuTemps();
          } else {
            // Afficher le message d'erreur du backend pour les autres cas
            const messageErreur = err.error || "Erreur inconnue lors de la suppression";
            this.toastr.error(messageErreur, 'Erreur de suppression');
          }
          this.cdr.detectChanges();
        }
      });
    }
  }

  // Méthodes pour gérer le formulaire de notes (suivi)
  reinitialiserFormulaireNote() {
    this.noteSaisie = {
      etudiant: undefined,
      cours: undefined,
      valeur: null,
      semestre: 'Semestre 1',
      appreciation: ''
    };
    this.noteEnEdition = null;
    this.afficherFormulaireNote = false;
  }

  chargerPourModifierNote(note: any) { 
    if (!note || !note.id) {
      this.toastr.error("Impossible de charger une note sans identifiant valide.", 'Erreur');
      console.error("❌ Note invalide : pas d'id ou note null");
      return;
    }
    
    this.noteEnEdition = note;
    this.noteSaisie = { ...note };
    this.afficherFormulaireNote = true;
    
    this.toastr.info(`Note pour ${note.etudiant?.nom} ${note.etudiant?.prenom} chargée dans le formulaire d'édition.`, 'Information');
    this.cdr.detectChanges();
  }

  supprimerNote(id: number) {
    if (!id) {
      this.toastr.error("Action annulée : Cette note ne possède pas d'identifiant unique.", 'Erreur');
      return;
    }

    if (confirm("Voulez-vous vraiment supprimer définitivement cette note ?")) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

      this.http.delete(`http://localhost:8080/notes/${id}`, { headers }).subscribe({
        next: () => {
          this.toastr.info("La note a été supprimée avec succès.", 'Information');
          if (this.noteEnEdition && this.noteEnEdition.id === id) {
            this.reinitialiserFormulaireNote();
          }
          // Recharger les notes après suppression
          this.chargerNotes();
        },
        error: (err) => {
          console.error("Détails erreur suppression note :", err);
          this.toastr.error("Erreur de suppression.", 'Erreur');
          this.cdr.detectChanges();
        }
      });
    }
  }

  chargerNotes() {
    const token = localStorage.getItem('token');
    const emailProf = localStorage.getItem('username');
    
    if (!token) return;

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    if (emailProf) {
      this.http.get<any>(`http://localhost:8080/notes/mes-notes-professeur/${emailProf}`, { headers }).subscribe({
        next: (response) => {
          if (response.success) {
            this.listeNotes = response.notes;
          } else {
            this.toastr.error(response.error || "Erreur lors du chargement des notes", 'Erreur');
            this.listeNotes = [];
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("Erreur lors de la récupération des notes", err);
          this.listeNotes = [];
          this.cdr.detectChanges();
        }
      });
    }
  }

  // ================= 📅 MODULE 2 : PLANIFICATION EMPLOI DU TEMPS REAL-TIME =================
  planifierEDT() {
    if (!this.nouvelEDT.cours || !this.nouvelEDT.heureDebut || !this.nouvelEDT.heureFin || !this.nouvelEDT.salle) {
      this.toastr.error("Veuillez remplir l'ensemble des champs (Matière, horaires et salle) avant de valider.", 'Erreur');
      return;
    }

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // Extraction de l'ID du cours (même logique que pour les notes, backend corrigé pour être cohérent)
    const coursIdBrut = this.nouvelEDT.cours && typeof this.nouvelEDT.cours === 'object' 
      ? this.nouvelEDT.cours.id 
      : this.nouvelEDT.cours;

    if (!coursIdBrut) {
      this.toastr.error("Veuillez sélectionner un cours valide.", 'Erreur');
      return;
    }

    // Création d'un payload propre pour le backend (avec seulement l'ID du cours)
    const edtPayload = {
      coursId: String(coursIdBrut),
      jour: this.nouvelEDT.jour,
      heureDebut: this.nouvelEDT.heureDebut,
      heureFin: this.nouvelEDT.heureFin,
      salle: this.nouvelEDT.salle
    };

    console.log("🔍 Contenu du edtPayload avant envoi :", edtPayload);

    // Vérification que tous les champs sont présents
    if (!edtPayload.coursId || !edtPayload.jour || !edtPayload.heureDebut || !edtPayload.heureFin || !edtPayload.salle) {
      this.toastr.error("Veuillez remplir l'ensemble des champs (Matière, jour, horaires et salle) avant de valider.", 'Erreur');
      return;
    }

    // Gestion du mode modification vs création
    if (this.edtEnEdition && this.edtEnEdition.id) {
      // ✏️ Mode modification : PUT pour mettre à jour la séance existante
      this.http.put(`http://localhost:8080/api/emploi-du-temps/${this.edtEnEdition.id}`, edtPayload, { headers }).subscribe({
        next: () => {
          this.toastr.success(`La séance a été modifiée avec succès !`, 'Succès');
          this.reinitialiserFormulaireEDT(); // Ferme la modale et réinitialise le formulaire
          this.chargerEmploiDuTemps(); // Rechargement immédiat du planning privé
          setTimeout(() => {
            this.cdr.detectChanges();
          }, 100);
        },
        error: (err) => {
          console.error("Erreur modification EDT:", err);
          let messageErreur = "Impossible de modifier la séance.";
          if (err.status === 400) messageErreur = "Données invalides : vérifiez les champs du formulaire.";
          if (err.status === 401) messageErreur = "Session expirée : veuillez vous reconnecter.";
          if (err.status === 404) messageErreur = "La séance à modifier n'existe plus.";
          if (err.status === 500) messageErreur = "Erreur interne du serveur : contactez l'administrateur.";
          this.toastr.error(messageErreur, 'Erreur');
           this.reinitialiserFormulaireEDT();
          this.cdr.detectChanges();
        }
      });
    } else {
      // ➕ Mode création : POST pour ajouter une nouvelle séance
      this.http.post('http://localhost:8080/api/emploi-du-temps/planifier', edtPayload, { headers }).subscribe({
        next: (data: any) => {
          this.toastr.success(`Le cours de "${this.nouvelEDT.cours.intitule}" a été planifié pour le ${this.nouvelEDT.jour} !`, 'Succès');
          this.reinitialiserFormulaireEDT(); // Ferme la modale et réinitialise le formulaire
          this.chargerEmploiDuTemps(); // Rechargement immédiat du planning privé
          setTimeout(() => {
            this.cdr.detectChanges();
          }, 100);
        },
        error: (err) => {
          console.error("Erreur planification EDT:", err);
          let messageErreur = "Impossible d'enregistrer le planning. Vérifiez les liaisons d'entités du backend.";
          if (err.status === 400) messageErreur = "Conflit d'horaire : cette salle est déjà occupée à ces horaires.";
          if (err.status === 401) messageErreur = "Session expirée : veuillez vous reconnecter.";
          if (err.status === 500) messageErreur = "Erreur interne du serveur : contactez l'administrateur.";
          this.toastr.error(messageErreur, 'Erreur');
           this.reinitialiserFormulaireEDT();
          this.cdr.detectChanges();
        }
      });
    }
  }

  // ================= 📅 MODULE 3 : EVALUATION / ENREGISTRER NOTE =================
  enregistrerNote(event: Event) {
    event.preventDefault();
    
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json' // ✨ Précision du type JSON
    });

    const etudiantIdBrut = this.noteSaisie.etudiant && typeof this.noteSaisie.etudiant === 'object' 
      ? this.noteSaisie.etudiant.id 
      : this.noteSaisie.etudiant;

    const coursIdBrut = this.noteSaisie.cours && typeof this.noteSaisie.cours === 'object' 
      ? this.noteSaisie.cours.id 
      : this.noteSaisie.cours;

    if (!etudiantIdBrut || !coursIdBrut) {
      this.toastr.error("Veuillez sélectionner un étudiant et une Unité d'Enseignement.", 'Erreur');
      return;
    }

    // ✨ ALIGNEMENT BACKEND : Remplacement du FormData par un objet JSON propre conforme au NoteRequest DTO
    const notePayload = {
      valeur: String(this.noteSaisie.valeur),
      semestre: this.noteSaisie.semestre,
      appreciation: this.noteSaisie.appreciation,
      etudiantId: String(etudiantIdBrut),
      coursId: String(coursIdBrut)
    };

    // Gestion du mode modification vs création
    if (this.noteEnEdition && this.noteEnEdition.id) {
      // ✏️ Mode modification : PUT pour mettre à jour la note existante
      this.http.put(`http://localhost:8080/notes/${this.noteEnEdition.id}`, notePayload, { headers }).subscribe({
        next: () => {
          this.toastr.success("🎉 La note a été modifiée avec succès !", 'Succès');
          this.reinitialiserFormulaireNote(); // Ferme la modale et réinitialise le formulaire
          this.chargerNotes(); // Recharger les notes après la modification
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("Détails erreur modification note:", err);
          let messageErreur = "Impossible de modifier la note.";
          if (err.status === 400) messageErreur = "Données invalides : vérifiez les champs du formulaire.";
          if (err.status === 401) messageErreur = "Session expirée : veuillez vous reconnecter.";
          if (err.status === 404) messageErreur = "La note à modifier n'existe plus.";
          if (err.status === 500) messageErreur = "Erreur interne du serveur : contactez l'administrateur.";
          this.toastr.error(messageErreur, 'Erreur');
          // 🔒 SÉCURITÉ : Forcer la fermeture du modal même si une erreur survient
          this.reinitialiserFormulaireNote();
          this.cdr.detectChanges();
        }
      });
    } else {
      // ➕ Mode création : POST pour ajouter une nouvelle note
      this.http.post('http://localhost:8080/notes/saisir', notePayload, { headers }).subscribe({
        next: () => {
          this.toastr.success("🎉 La note a été ajoutée avec succès !", 'Succès');
          this.reinitialiserFormulaireNote(); // Ferme la modale et réinitialise le formulaire
          this.chargerNotes(); // Recharger les notes après la saisie
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("Détails erreur ajout note:", err);
          this.toastr.error(err.error?.message || "Erreur lors de l'ajout de la note (Vérifiez les doublons).", 'Erreur');
          // 🔒 SÉCURITÉ : Forcer la fermeture du modal même si une erreur survient
          this.reinitialiserFormulaireNote();
          this.cdr.detectChanges();
        }
      });
    }
  }

  // Fonction standard Angular pour comparer les objets par ID (utilisée pour les selects)
  comparerObjets(o1: any, o2: any): boolean {
    if (o1 === undefined && o2 === undefined) return true;
    if (o1 === null && o2 === null) return true;
    if (o1 === null || o1 === undefined) return false;
    if (o2 === null || o2 === undefined) return false;
    return o1.id === o2.id;
  }

  deconnecter() {
    localStorage.removeItem('token');
    localStorage.removeItem('username'); 
    localStorage.removeItem('role');
    this.router.navigate(['/']);
  }
}