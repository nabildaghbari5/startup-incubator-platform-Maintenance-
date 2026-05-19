import { Routes } from '@angular/router';

// PUBLIC
import { HomeComponent } from './pages/home/home';
import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';

// DASHBOARDS
import { PorteurComponent } from './pages/porteur/porteur';
import { AdminComponent } from './pages/admin/admin';
import { IncubateurComponent } from './pages/incubateur/incubateur';
import { ExpertComponent } from './pages/expert/expert';

// INCUBATEUR PAGES
import { DashboardComponent } from './pages/pagesIncubateur/dashboard/dashboard';
import { ProgrammeComponent } from './pages/pagesIncubateur/programme/programme';
import { DocumentsComponent } from './pages/pagesIncubateur/documents/documents';
import { EvaluationsComponent } from './pages/pagesIncubateur/evaluations/evaluations';
import { MessagesComponent } from './pages/pagesIncubateur/messages/messages';
import { ProfilComponent } from './pages/pagesIncubateur/profil/profil';
import { ParametresComponent } from './pages/pagesIncubateur/paramètres/parametres';

export const routes: Routes = [

  // PUBLIC
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // DASHBOARDS
  { path: 'porteur', component: PorteurComponent },
  { path: 'admin', component: AdminComponent },
  { path: 'expert', component: ExpertComponent },
  { path: 'incubateur', component: IncubateurComponent },

  // ADMIN
  { path: 'admin/utilisateurs', component: AdminComponent },
  { path: 'admin/roles', component: AdminComponent },
  { path: 'admin/programme', component: AdminComponent },
  { path: 'admin/statistiques', component: AdminComponent },
  { path: 'admin/decisions', component: AdminComponent },
  { path: 'admin/profil', component: AdminComponent },

  // EXPERT
  { path: 'expert/projets', component: ExpertComponent },
  { path: 'expert/evaluations', component: ExpertComponent },
  { path: 'expert/messages', component: ExpertComponent },
  { path: 'expert/profil', component: ExpertComponent },

  // INCUBATEUR
  { path: 'dashboard', component: DashboardComponent },
  { path: 'programme', component: ProgrammeComponent },
  { path: 'documents', component: DocumentsComponent },
  { path: 'evaluations', component: EvaluationsComponent },
  { path: 'messages', component: MessagesComponent },
  { path: 'profil', component: ProfilComponent },
  { path: 'parametres', component: ParametresComponent },

  // FALLBACK
  { path: '**', redirectTo: 'login' }

];