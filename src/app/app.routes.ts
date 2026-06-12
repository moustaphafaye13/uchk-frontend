
import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { EtudiantsComponent } from './etudiants/etudiants';
import { BudgetsComponent } from './budgets/budgets';
import { FormationsComponent } from './formations/formations';  
import { EspaceEtudiantComponent } from './espace-etudiant/espace-etudiant';
import { ProfesseurComponent } from './professeur/professeur'; // Importation sans .component

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'dashboard', component: EtudiantsComponent }, // <-- REGARDE BIEN CETTE VIRGULE À LA FIN !
  { path: 'budgets', component: BudgetsComponent },
  { path: 'formations', component: FormationsComponent }, // <-- NOUVELLE ROUTE
  { path: 'espace-etudiant', component: EspaceEtudiantComponent },
  { path: 'professeur', component: ProfesseurComponent } // Nouvelle route professeur
];