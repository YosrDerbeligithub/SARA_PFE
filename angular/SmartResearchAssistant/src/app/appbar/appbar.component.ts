import { Component, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-appbar',
  templateUrl: './appbar.component.html',
  styleUrls: ['./appbar.component.css'],
  standalone: true,
  imports: [RouterLink, RouterLinkActive]
})
export class AppbarComponent {
  showDatasets = false;
  showComparison = false;
  showAccount = false;
  username = '';

  constructor(private auth: AuthService, private router: Router) {
    this.username = this.auth.getUsername(); // Implement getUsername() in AuthService
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/signin']);
  }

  toggleDatasetsDropdown(event: MouseEvent) {
    event.preventDefault();
    this.showDatasets = !this.showDatasets;
    this.showComparison = false;
  }

  toggleComparisonDropdown(event: MouseEvent) {
    event.preventDefault();
    this.showComparison = !this.showComparison;
    this.showDatasets = false;
  }

  // Optional: close both dropdowns on outside click
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      this.showDatasets = false;
      this.showComparison = false;
    }
  }
}