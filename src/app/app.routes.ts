
import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { EtudiantsComponent } from './etudiants/etudiants';
import { BudgetsComponent } from './budgets/budgets';
import { FormationsComponent } from './formations/formations'; // <-- IMPORTATION

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'dashboard', component: EtudiantsComponent }, // <-- REGARDE BIEN CETTE VIRGULE À LA FIN !
  { path: 'budgets', component: BudgetsComponent },
  { path: 'formations', component: FormationsComponent } // <-- NOUVELLE ROUTE
];