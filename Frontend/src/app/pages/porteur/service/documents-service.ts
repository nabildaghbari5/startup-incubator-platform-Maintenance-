import {
  HttpClient,
  HttpEvent,
  HttpEventType,
  HttpHeaders,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface DocumentsDTO {
  id?: number;
  document?: string;
  fileName?: string;
  fileType?: string;
  uploadedAt?: string;
  score?: number | null;
  commentaireIA?: string;
  statut?: string;
  phase?: { id: number; titre?: string; numero?: number };
  porteur?: { id: number; nom?: string; prenom?: string; email?: string };
}

export interface UploadProgress {
  progress: number;
  response?: DocumentsDTO;
}

@Injectable({
  providedIn: 'root',
})
export class DocumentsService {
   private api = 'http://localhost:8083/api/documents';
 // private api = 'http://192.168.1.2:8083/api/documents';
  constructor(private http: HttpClient) {}

  private get headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: 'Bearer ' + (localStorage.getItem('token') || ''),
    });
  }

  private get porteurId(): number {
    return Number(localStorage.getItem('userId') || '0');
  }

  /**
   * POST /api/documents/upload/{porteurId}/{phaseId}
   */
  uploadDocument(
    phaseId: number,
    file: File,
    porteurId: number = this.porteurId
  ): Observable<UploadProgress> {
    const formData = new FormData();
    formData.append('document', file);

    return this.http
      .post<DocumentsDTO>(
        `${this.api}/upload/${porteurId}/${phaseId}`,
        formData,
        {
          headers: this.headers,
          reportProgress: true,
          observe: 'events',
        }
      )
      .pipe(
        filter(
          (event): event is HttpEvent<DocumentsDTO> =>
            event.type === HttpEventType.UploadProgress ||
            event.type === HttpEventType.Response
        ),
        map(event => {
          if (event.type === HttpEventType.UploadProgress) {
            const total = event.total ?? file.size;
            const progress =
              total > 0
                ? Math.round((100 * (event.loaded ?? 0)) / total)
                : 0;
            return { progress };
          }
          if (event.type === HttpEventType.Response) {
            return { progress: 100, response: event.body ?? undefined };
          }
          return { progress: 0 };
        })
      );
  }

  /**
   * GET /api/documents/phase/{phaseId}
   */
  getDocumentsByPhase(phaseId: number): Observable<DocumentsDTO[]> {
    return this.http.get<DocumentsDTO[]>(
      `${this.api}/phase/${phaseId}`,
      { headers: this.headers }
    );
  }

  /**
   * GET /api/documents/{porteurId}/{phaseId}/info
   */
  getDocumentInfo(
    phaseId: number,
    porteurId: number = this.porteurId
  ): Observable<DocumentsDTO> {
    return this.http.get<DocumentsDTO>(
      `${this.api}/${porteurId}/${phaseId}/info`,
      { headers: this.headers }
    );
  }

  /**
   * GET /api/documents/{porteurId}/{phaseId}
   */
  getDocument(
    phaseId: number,
    porteurId: number = this.porteurId
  ): Observable<DocumentsDTO> {
    return this.http.get<DocumentsDTO>(
      `${this.api}/${porteurId}/${phaseId}`,
      { headers: this.headers }
    );
  }

  /**
   * PATCH /api/documents/{documentId}/score
   */
  updateDocumentScore(
    documentId: number,
    score: number
  ): Observable<DocumentsDTO> {
    return this.http.patch<DocumentsDTO>(
      `${this.api}/${documentId}/score`,
      { score },
      { headers: this.headers }
    );
  }
}
