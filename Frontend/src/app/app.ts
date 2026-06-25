import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationSoundService } from './services/notification-sound.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent {
}
