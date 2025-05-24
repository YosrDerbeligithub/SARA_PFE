// src/app/sara-admin/pages/sites/sites.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Site, SiteType } from '../../models/site.model';
import { NotificationService } from '../../services/notification.service';
import { SiteService } from '../../services/site.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Import RouterModule
import { ReactiveFormsModule } from '@angular/forms';  // Add this import

@Component({
  selector: 'app-sites',
  templateUrl: './sites.component.html',
  styleUrls: ['./sites.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
})
export class SitesComponent implements OnInit {
  sites: Site[] = [];
  filteredSites: Site[] = [];
  isLoading = true;
  showDialog = false;
  isSubmitting = false;
  editingSite: Site | null = null;
  siteForm: FormGroup;
  searchTerm = '';
  sortField = 'name';
  sortDirection = 'asc';
  showDeleteConfirm = false;
  siteToDelete: Site | null = null;

  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private siteService: SiteService
  ) {
    this.siteForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      type: ['', Validators.required],
      displayColor: ['#3b82f6', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.loadSites();
  }

  loadSites(): void {
    this.isLoading = true;

    this.siteService.getSites().subscribe({
      next: (sites) => {
        this.sites = sites;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.add({
          message: 'Failed to load sites: ' + error.message,
          type: 'error',
          icon: 'fas fa-exclamation-circle',
        });
      },
    });
  }

  applyFilters(): void {
    let filtered = [...this.sites];

    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (site) =>
          site.name.toLowerCase().includes(term) ||
          site.type.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (this.sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'locationCount':
          comparison = a.locationCount - b.locationCount;
          break;
        case 'sensorBoxCount':
          comparison = a.sensorBoxCount - b.sensorBoxCount;
          break;
        case 'createdAt':
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });

    this.filteredSites = filtered;
  }

  search(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }

  sort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) {
      return 'fas fa-sort';
    }
    return this.sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
  }

  openDialog(site?: Site): void {
    this.editingSite = site || null;

    if (site) {
      this.siteForm.patchValue({
        name: site.name,
        type: site.type,
        displayColor: site.displayColor,
      });
    } else {
      this.siteForm.reset({
        name: '',
        type: '',
        displayColor: '#3b82f6',
      });
    }

    this.showDialog = true;
  }

  closeDialog(): void {
    this.showDialog = false;
    this.editingSite = null;
  }

  confirmDelete(site: Site): void {
    this.siteToDelete = site;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.siteToDelete = null;
  }

  deleteSite(): void {
    if (!this.siteToDelete) return;

    this.isLoading = true;

    this.siteService.deleteSite(this.siteToDelete.siteId).subscribe({
      next: () => {
        this.sites = this.sites.filter((s) => s.siteId !== this.siteToDelete!.siteId);
        this.applyFilters();
        this.isLoading = false;
        this.showDeleteConfirm = false;
        this.siteToDelete = null;

        this.notificationService.add({
          message: 'Site deleted successfully',
          type: 'success',
          icon: 'fas fa-check-circle',
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.showDeleteConfirm = false;

        this.notificationService.add({
          message: 'Failed to delete site: ' + error.message,
          type: 'error',
          icon: 'fas fa-exclamation-circle',
        });
      },
    });
  }

  submitForm(): void {
    if (this.siteForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.siteForm.controls).forEach((key) => {
        const control = this.siteForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    const formValues = this.siteForm.value;

    if (this.editingSite) {
      // Update existing site
      const updatedSite = {
        name: formValues.name,
        type: formValues.type,
        displayColor: formValues.displayColor,
      };
      const operation = this.editingSite
      ? this.siteService.updateSite(this.editingSite.siteId, formValues)
      : this.siteService.createSite(formValues);

      operation.subscribe({
        next: (site) => {
          const index = this.sites.findIndex((s) => s.siteId === this.editingSite!.siteId);
          if (index !== -1) {
            this.sites[index] = site;
          }

          this.isSubmitting = false;
          this.closeDialog();
          this.notificationService.add({
            message: 'Site updated successfully',
            type: 'success',
            icon: 'fas fa-check-circle',
          });
          this.loadSites();

        },
        error: (error) => {
          this.isSubmitting = false;
          if (error.message.includes('already exists')) {
            this.siteForm.get('name')?.setErrors({ 
              duplicate: error.message.replace('Failed to update site: ', '') 
            });
          }
          this.notificationService.add({
            message: error.message,
            type: 'error',
            icon: 'fas fa-exclamation-circle',
          });
        },
      });
    } else {
      // Create new site
      const newSite = {
        name: formValues.name,
        type: formValues.type,
        displayColor: formValues.displayColor,
      };

      this.siteService.createSite(newSite).subscribe({
        next: (site) => {
          this.sites.unshift(site);
          this.isSubmitting = false;
          this.closeDialog();
          this.notificationService.add({
            message: 'Site created successfully',
            type: 'success',
            icon: 'fas fa-check-circle',
          });
          this.loadSites();

        },
        error: (error) => {
          this.isSubmitting = false;
          if (error.message.includes('already exists')) {
            // Pass the actual error message to the form
            this.siteForm.get('name')?.setErrors({ 
              duplicate: error.message.replace('Failed to create site: ', '') 
            });
          }
            this.notificationService.add({
            message: 'Failed to create site: ' + error.message,
            type: 'error',
            icon: 'fas fa-exclamation-circle',
          });
        },
      });
    }
  }

  getSiteTypeBadgeClass(type: string): string {
    switch (type) {
      case 'CAMPUS':
        return 'badge-campus';
      case 'MUSEUM':
        return 'badge-museum';
      case 'OTHER':
        return 'badge-other';
      default:
        return 'badge-other';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

}