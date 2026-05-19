import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {

  email: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  goToRegister() {
    this.router.navigate(['/register']);
  }

  onLogin() {

  this.authService.login(this.email, this.password).subscribe({

    next: (res: any) => {

      console.log("RESPONSE =", res);

      localStorage.setItem('token', res.token);
      localStorage.setItem('userId', res.user.id);
      localStorage.setItem('userId', res.userId); 
      localStorage.setItem('email', res.user.email);
      localStorage.setItem('nom', res.user.nom);
      localStorage.setItem('role', res.user.role);

      const role = res.user.role?.toUpperCase();

      if (role === 'PORTEUR') {

        this.router.navigate(['/porteur']);

      } else if (role === 'ADMIN') {

        this.router.navigate(['/admin']);

      } else if (role === 'INCUBATEUR') {

        this.router.navigate(['/incubateur']);

      } else if (role === 'EXPERT') {

        this.router.navigate(['/expert']);

      } else {

        console.log("ROLE NON RECONNU :", role);

      }
    },

    error: () => {

      alert("Email ou mot de passe incorrect");

    }

  });

}
}