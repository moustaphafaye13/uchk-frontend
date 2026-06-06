import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule], // On importe les outils pour les formulaires
  templateUrl: './login.html', // Vérifie bien le nom de ton fichier HTML ici
  styleUrls: []
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = '';

  // On injecte le client HTTP d'Angular et le gestionnaire de navigation (Router)
  constructor(private http: HttpClient, private router: Router) {}

  onLogin(event: Event) {
    event.preventDefault(); // Évite que la page ne s'actualise

    const loginData = {
      username: this.username,
      password: this.password
    };

    // On appelle exactement ton API Spring Boot
    this.http.post<any>('http://localhost:8080/auth/login', loginData).subscribe({
      next: (response) => {
        // Si la connexion réussit (Statut 200), on stocke le jeton JWT dans le navigateur
        localStorage.setItem('token', response.token);
        alert('Connexion réussie !');
this.router.navigate(['/dashboard']);
        // Plus tard, on redirigera vers la page des étudiants ici
      },
      error: (err) => {
        // Si Spring Boot renvoie une erreur (identifiants incorrects)
        this.errorMessage = "Nom d'utilisateur ou mot de passe incorrect.";
        console.error(err);
      }
    });
  }
}