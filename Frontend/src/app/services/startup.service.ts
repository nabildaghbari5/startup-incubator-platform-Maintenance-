import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StartupService {

  private api = "http://localhost:8082/api/startups";

  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<any[]>(this.api);
  }

  add(startup: any) {
    return this.http.post(this.api, startup);
  }

  delete(id: number) {
    return this.http.delete(this.api + "/" + id);
  }

  nextPhase(id: number) {
    return this.http.put(this.api + "/" + id + "/next-phase", {});
  }
}