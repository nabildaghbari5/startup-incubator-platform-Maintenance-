import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './documents.html',
  styleUrls: ['./documents.css']
})
export class DocumentsComponent {

  documents = [
    { name: 'Business Plan.pdf', date: '10 Mai 2025' },
    { name: 'Pitch Deck.pptx', date: '08 Mai 2025' }
  ];

  selectedFile: File | null = null;

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  uploadFile() {
    if (this.selectedFile) {
      this.documents.push({
        name: this.selectedFile.name,
        date: new Date().toLocaleDateString()
      });
    }
  }

  download(doc: any) {
    alert('Téléchargement: ' + doc.name);
  }

  delete(doc: any) {
    this.documents = this.documents.filter(d => d !== doc);
  }

}