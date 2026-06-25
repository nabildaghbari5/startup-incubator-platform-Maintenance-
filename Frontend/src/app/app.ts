import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { WebsocketService } from './services/websocket-service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent {
  messagesRecus: string[] = [];
  private sub!: Subscription;
     constructor(private websocketService: WebsocketService) {}


     ngOnInit(): void {
      this.websocketService.connect();
    
      this.websocketService.messages$.subscribe(msg => {
        this.messagesRecus.push(msg);
      });
    
      this.websocketService.connected$.subscribe(isConnected => {
        console.log('État connexion:', isConnected);
      });
    }

  envoyer() {
    this.websocketService.sendMessage(
      'Bonjour Spring Boot'
    );
  }

  

}