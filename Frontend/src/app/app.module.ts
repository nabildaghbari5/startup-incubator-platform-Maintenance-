import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app';
import { IncubateurComponent } from './pages/incubateur/incubateur';

@NgModule({
  declarations: [
    AppComponent,
    IncubateurComponent
  ],
  imports: [
    BrowserModule,
    FormsModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}