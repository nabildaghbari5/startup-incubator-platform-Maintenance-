import { PhaseService } from './../../service/phase-service';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EvenementDTO, PhaseDTO } from './../../../../services/programme.service';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-programme-porteur',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './programme-porteur.html',
  styleUrls: ['./programme-porteur.css'],
}) 
export class ProgrammePorteur implements OnInit {
  upcomingRdv: EvenementDTO | null = null; rdvDaysLeft = 0;
  @Input() phases: any[] = [];
  constructor(
   
  ) { }
  ngOnInit(): void { 
  }


  
  checkRdv(evs: EvenementDTO[]) {
    const today = new Date();
    const soon = evs.find(e => {
      const d = new Date(e.date);
      const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000);
      return diff >= 0 && diff <= 7;
    });
    if (soon) { this.upcomingRdv = soon; this.rdvDaysLeft = Math.ceil((new Date(soon.date).getTime() - today.getTime()) / 86400000); }
    else this.upcomingRdv = null;
  }


  


}
