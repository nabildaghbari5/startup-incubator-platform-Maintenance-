import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

export interface Message {
  id: number;
  text?: string;
  file?: { name: string; size: string };
  mine: boolean;
  sender: string;
  senderInitials: string;
  senderColor: string;
  time: string;
}

export interface Conversation {
  id: number;
  type: 'private' | 'group';
  name: string;
  initials: string;
  color: string;
  lastMessage: string;
  time: string;
  unread?: number;
  online?: boolean;
  members?: number;
  messages: Message[];
}

@Pipe({ name: 'filter', standalone: true })
export class FilterPipe implements PipeTransform {
  transform(items: Conversation[], type: string): Conversation[] {
    return items.filter(i => i.type === type);
  }
}

@Component({
  selector: 'app-messagerie',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FilterPipe],
  templateUrl: './messages.html',
  styleUrls: ['./messages.css'],
})
export class MessagesComponent implements OnInit, AfterViewChecked {

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;

  searchQuery = '';
  newMessage = '';
  isTyping = false;
  activeConv: Conversation | null = null;
  private typingTimer: any;
  private shouldScroll = false;

  allConvs: Conversation[] = [
    {
      id: 1,
      type: 'group',
      name: 'Promotion S2T 2025',
      initials: 'GR',
      color: '#7c3aed',
      lastMessage: 'Bienvenue dans le groupe !',
      time: '10:30',
      unread: 3,
      online: true,
      members: 12,
      messages: [
        { id: 1, text: 'Bienvenue à tous dans le programme S2T 2025 ! 🚀', mine: false, sender: 'Admin S2T', senderInitials: 'AS', senderColor: '#7c3aed', time: '10:00' },
        { id: 2, text: 'Merci ! Très content de rejoindre ce programme.', mine: true, sender: 'Moi', senderInitials: 'P', senderColor: '#ec4899', time: '10:05' },
        { id: 3, text: 'Le programme démarre lundi prochain. Préparez vos pitchs !', mine: false, sender: 'Incubateur', senderInitials: 'IN', senderColor: '#10b981', time: '10:20' },
        { id: 4, text: 'Voici le guide de l\'incubation', mine: false, sender: 'Incubateur', senderInitials: 'IN', senderColor: '#10b981', time: '10:25',
          file: { name: 'Guide_incubation_2025.pdf', size: '2.4 MB' } },
        { id: 5, text: 'Parfait, je vais le lire !', mine: true, sender: 'Moi', senderInitials: 'P', senderColor: '#ec4899', time: '10:30' },
      ]
    },
    {
      id: 2,
      type: 'private',
      name: 'Équipe Incubateur',
      initials: 'IN',
      color: '#10b981',
      lastMessage: 'Votre dossier a été validé ✓',
      time: '09:15',
      unread: 1,
      online: true,
      messages: [
        { id: 1, text: 'Bonjour ! Votre candidature a bien été reçue.', mine: false, sender: 'Incubateur', senderInitials: 'IN', senderColor: '#10b981', time: '08:00' },
        { id: 2, text: 'Merci beaucoup ! Quand aura lieu l\'entretien ?', mine: true, sender: 'Moi', senderInitials: 'P', senderColor: '#ec4899', time: '08:30' },
        { id: 3, text: 'L\'entretien est prévu le 25 Mai à 14h00.', mine: false, sender: 'Incubateur', senderInitials: 'IN', senderColor: '#10b981', time: '08:45' },
        { id: 4, text: 'Votre dossier a été validé ✓', mine: false, sender: 'Incubateur', senderInitials: 'IN', senderColor: '#10b981', time: '09:15' },
      ]
    },
    {
      id: 3,
      type: 'private',
      name: 'Mentor — Dorsaf Hlel',
      initials: 'DH',
      color: '#3b82f6',
      lastMessage: 'À bientôt pour la session !',
      time: 'Hier',
      online: false,
      messages: [
        { id: 1, text: 'Bonjour ! Je suis votre mentor pour la phase Business Model.', mine: false, sender: 'Dorsaf Hlel', senderInitials: 'DH', senderColor: '#3b82f6', time: 'Hier 14:00' },
        { id: 2, text: 'Bonjour Dorsaf ! Ravi de travailler avec vous.', mine: true, sender: 'Moi', senderInitials: 'P', senderColor: '#ec4899', time: 'Hier 14:10' },
        { id: 3, text: 'Notre première session est jeudi à 10h. Préparez votre Business Model Canvas.', mine: false, sender: 'Dorsaf Hlel', senderInitials: 'DH', senderColor: '#3b82f6', time: 'Hier 14:15' },
        { id: 4, text: 'À bientôt pour la session !', mine: false, sender: 'Dorsaf Hlel', senderInitials: 'DH', senderColor: '#3b82f6', time: 'Hier 18:00' },
      ]
    },
    {
      id: 4,
      type: 'group',
      name: 'Startups Tech Track',
      initials: 'TT',
      color: '#f97316',
      lastMessage: 'Quelqu\'un a le lien Zoom ?',
      time: 'Hier',
      unread: 5,
      online: true,
      members: 8,
      messages: [
        { id: 1, text: 'Salut tout le monde ! Qui est sur le track Tech ?', mine: false, sender: 'Karim J.', senderInitials: 'KJ', senderColor: '#f97316', time: 'Hier 09:00' },
        { id: 2, text: 'Moi ! Je travaille sur une app IA pour les PME.', mine: true, sender: 'Moi', senderInitials: 'P', senderColor: '#ec4899', time: 'Hier 09:05' },
        { id: 3, text: 'Super ! On organise une session de networking vendredi.', mine: false, sender: 'Karim J.', senderInitials: 'KJ', senderColor: '#f97316', time: 'Hier 09:30' },
        { id: 4, text: 'Quelqu\'un a le lien Zoom ?', mine: false, sender: 'Sara M.', senderInitials: 'SM', senderColor: '#ec4899', time: 'Hier 17:00' },
      ]
    },
  ];

  filteredConvs: Conversation[] = [];

  ngOnInit(): void {
    this.filteredConvs = [...this.allConvs];
    this.activeConv = this.allConvs[0];
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  selectConv(conv: Conversation): void {
    this.activeConv = conv;
    conv.unread = 0;
    this.shouldScroll = true;
  }

  filterConvs(): void {
    const q = this.searchQuery.toLowerCase();
    this.filteredConvs = this.allConvs.filter(c =>
      !q || c.name.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q)
    );
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.activeConv) return;

    const msg: Message = {
      id: Date.now(),
      text: this.newMessage,
      mine: true,
      sender: 'Moi',
      senderInitials: 'P',
      senderColor: '#ec4899',
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    this.activeConv.messages.push(msg);
    this.activeConv.lastMessage = this.newMessage;
    this.activeConv.time = msg.time;
    this.newMessage = '';
    this.shouldScroll = true;

    // Simule une réponse automatique après 1.5s
    this.simulateReply();
  }

  onTyping(): void {
    clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => {}, 1000);
  }

  attachFile(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.activeConv) return;

    const msg: Message = {
      id: Date.now(),
      file: {
        name: file.name,
        size: this.formatSize(file.size),
      },
      mine: true,
      sender: 'Moi',
      senderInitials: 'P',
      senderColor: '#ec4899',
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    this.activeConv.messages.push(msg);
    this.activeConv.lastMessage = `📄 ${file.name}`;
    this.shouldScroll = true;
  }

  newConversation(): void {
    const name = prompt('Nom de la conversation :');
    if (!name) return;
    const newConv: Conversation = {
      id: Date.now(),
      type: 'private',
      name,
      initials: name.substring(0, 2).toUpperCase(),
      color: '#7c3aed',
      lastMessage: '',
      time: 'maintenant',
      online: false,
      messages: [],
    };
    this.allConvs.push(newConv);
    this.filterConvs();
    this.selectConv(newConv);
  }

  private simulateReply(): void {
    if (!this.activeConv) return;
    this.isTyping = true;
    setTimeout(() => {
      this.isTyping = false;
      const replies = [
        'Merci pour votre message !',
        'Je reviens vers vous rapidement.',
        'Bien reçu, on en discute lors de notre prochaine session.',
        'Parfait, continuez comme ça ! 👍',
      ];
      const reply: Message = {
        id: Date.now(),
        text: replies[Math.floor(Math.random() * replies.length)],
        mine: false,
        sender: this.activeConv!.name,
        senderInitials: this.activeConv!.initials,
        senderColor: this.activeConv!.color,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };
      this.activeConv!.messages.push(reply);
      this.activeConv!.lastMessage = reply.text!;
      this.shouldScroll = true;
    }, 1500);
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}