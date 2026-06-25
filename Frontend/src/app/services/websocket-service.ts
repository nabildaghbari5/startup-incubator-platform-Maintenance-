import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService implements OnDestroy {

  public connected$ = new BehaviorSubject<boolean>(false);

  private stompClient!: Client;
  private subscription!: StompSubscription;

  // Les composants s'abonnent ici pour recevoir les messages
  public messages$ = new Subject<string>();

  connect(): void {
    console.log('Activation STOMP...');
  
    this.stompClient = new Client({
      brokerURL: 'ws://localhost:8083/ws', // URL  du websocket : lors d'utilisation du brokerURL on leve le withSockJS() coté abckend 
      reconnectDelay: 5000,
  
      debug: (str) => {
        console.log('[STOMP DEBUG]', str);
      },
  
      onConnect: (frame) => {
        console.log('✅ CONNECTÉ STOMP', frame);
  
        this.connected$.next(true);
  
        this.subscription = this.stompClient.subscribe(
          '/topic/notifications',
          (message: IMessage) => {
            console.log('MESSAGE REÇU', message.body);
            this.messages$.next(message.body);
          }
        );
      },
  
      onWebSocketError: (err) => {
        console.error('❌ WebSocket error', err);
      },
  
      onStompError: (frame) => {
        console.error('❌ STOMP error', frame);
      }
    });
  
    this.stompClient.activate();
  }


 sendMessage(message: string): void {
    if (!this.stompClient) {
      console.warn('Client non initialisé');
      return;
    }

    if (this.stompClient.connected) {
      this.stompClient.publish({
        destination: '/app/send',
        body: message
      });

      console.log('Message envoyé');
    } else {
      console.warn('WebSocket pas encore connecté');
    }
  }

  disconnect(): void {
    this.subscription?.unsubscribe();
    this.stompClient?.deactivate();
  }

  // Nettoyage automatique si le service est détruit
  ngOnDestroy(): void {
    this.disconnect();
  }
}