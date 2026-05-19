import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {

  step         = 1;
  selectedRole = 'PORTEUR';
  isLoading    = false;
  showPassword = false;

 form: {
  nom?: string;
  prenom?: string;
  telephone?: string;
  ville?: string;
  startup?: string;
  secteur?: string;

  nomOrganisation?: string;
  secteurIncubateur?: string;
  nbStartups?: number;
  anneesExperience?: number;

  roleAdmin?: string;

  email?: string;
  password?: string;
} = {};

  apiUrl = 'http://localhost:8083/api/auth/register';

  roles = [
    { key: 'PORTEUR',    label: 'Porteur',    icon: '🚀', desc: 'Porteur de projet startup' },
    { key: 'INCUBATEUR', label: 'Incubateur', icon: '🏢', desc: "Structure d'incubation"    },
    { key: 'EXPERT',     label: 'Expert',     icon: '🎓', desc: 'Mentor & expert sectoriel' },
    { key: 'ADMIN',      label: 'Admin',      icon: '⚙️', desc: 'Administrateur plateforme' }
  ];

  get totalSteps(): number { return 3; }

  get progress(): number {
    return Math.round((this.step / this.totalSteps) * 100);
  }

  get stepLabel(): string {
    if (this.step === 1) return 'Informations personnelles';
    if (this.step === 2) return 'Informations complémentaires';
    return 'Compte & sécurité';
  }

  constructor(private http: HttpClient, private router: Router) {}

  selectRole(role: string): void {
    this.selectedRole = role;
    this.form = {};
    this.step = 1;
  }

  nextStep(): void { if (this.step < 3) this.step++; }
  prevStep(): void { if (this.step > 1) this.step--; }

  togglePassword(): void { this.showPassword = !this.showPassword; }

  goToLogin(): void { this.router.navigate(['/login']); }

  register(): void {
    if (!this.form.email || !this.form.password) {
      alert("Veuillez remplir l'email et le mot de passe.");
      return;
    }

    this.isLoading = true;

    let user: any = {
      email:    this.form.email,
      password: this.form.password,
      role:     this.selectedRole
    };

    if (this.selectedRole === 'PORTEUR') {
      user = {
        ...user,
        nom:       this.form.nom,
        telephone: this.form.telephone,
        ville:     this.form.ville,
        startup:   this.form.startup,
        secteur:   this.form.secteur
      };
    }

    if (this.selectedRole === 'INCUBATEUR') {

  user = {
    ...user,

    nom: this.form.nomOrganisation,

    secteurIncubateur: this.form.secteurIncubateur,

    nbStartups: this.form.nbStartups
  };
}

    if (this.selectedRole === 'EXPERT') {

  user = {
    ...user,

    nom: this.form.nom,

    prenom: this.form.prenom,

    telephone: this.form.telephone,

    secteur: this.form.secteur,

    anneesExperience: this.form.anneesExperience,

    startup: this.form.startup,

    roleAdmin: this.form.roleAdmin
  };
}

    if (this.selectedRole === 'ADMIN') {
      user = {
        ...user,
        nom:       this.form.nom,
        prenom:    this.form.prenom,
        roleAdmin: this.form.roleAdmin
      };
    }

    console.log('DATA ENVOYÉE :', user);

    this.http.post(this.apiUrl, user).subscribe({
      next: () => {
        this.isLoading = false;
        alert('Inscription réussie 🎉');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
        alert("Erreur lors de l'inscription");
      }
    });
  }
}