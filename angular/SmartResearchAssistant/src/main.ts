import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { Collapse } from 'bootstrap';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http'; // Import HTTP_INTERCEPTORS
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap';
import { importProvidersFrom } from '@angular/core';
import { AuthInterceptor } from './app/interceptors/auth.interceptor'; // Import your interceptor

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(HttpClientModule), // Import HttpClientModule globally
    ...appConfig.providers, // Spread appConfig providers here
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true, // Allows multiple interceptors
    },
  ],
})
  .then(() => {
    // Initialize Bootstrap components after app is stable
    document.querySelectorAll('[data-bs-toggle="collapse"]')
      .forEach(el => new Collapse(el));
  })
  .catch((err) => console.error(err));
