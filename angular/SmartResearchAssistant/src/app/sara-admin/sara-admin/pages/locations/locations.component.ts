// src/app/sara-admin/pages/locations/locations.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Location } from '../../models/location.model';
import { Site } from '../../models/site.model';
import { NotificationService } from '../../services/notification.service';
import { LocationService } from '../../services/location.service';
import { SiteService } from '../../services/site.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

type EnrichedLocation = Location & {
  siteId: number; // Remove null possibility
};

@Component({
  selector: 'app-locations',
  templateUrl: './locations.component.html',
  styleUrls: ['./locations.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class LocationsComponent implements OnInit {
  locations: Location[] = [];
  filteredLocations: Location[] = [];
  sites: Site[] = [];
  isLoading = true;
  showDialog = false;
  isSubmitting = false;
  editingLocation: Location | null = null;
  locationForm: FormGroup;
  searchTerm = '';
  selectedSiteFilter = 'all';
  sortField = 'name';
  sortDirection = 'asc';
  showDeleteConfirm = false;
  locationToDelete: Location | null = null;

  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private locationService: LocationService,
    private siteService: SiteService
  ) {
    this.locationForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      siteId: ['', Validators.required],
      displayColor: ['#FFFFFF', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;

    // Load sites first, then locations
    this.siteService.getSites().subscribe({
      next: (sites) => {
        this.sites = sites;

        this.locationService.getLocations().subscribe({
          next: (locations) => {
            // Enrich locations with siteId
            this.locations = locations.map((location) => {
              const site = this.sites.find((s) => s.name === location.siteName);
              if (!site) {
                console.error(`Site not found for location: ${location.name}`);
                throw new Error(`Site not found for location: ${location.name}`);
              }
              return {
                
                ...location,
                siteId: site.siteId, // Map siteName to siteId
              } as EnrichedLocation;
            });
            this.applyFilters();
            this.isLoading = false;
          },
          error: (error) => {
            this.isLoading = false;
            this.notificationService.add({
              message: 'Failed to load locations: ' + error.message,
              type: 'error',
              icon: 'fas fa-exclamation-circle',
            });
          },
        });
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
    let filtered = [...this.locations];

    // Apply site filter
    if (this.selectedSiteFilter !== 'all') {
      const selectedSiteId = parseInt(this.selectedSiteFilter, 10); // Convert to number
if (!isNaN(selectedSiteId)) {
      filtered = filtered.filter((location) => location.siteId === selectedSiteId);
    }
}

    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (location) =>
          location.name.toLowerCase().includes(term) ||
          location.siteName.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (this.sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'siteName':
          comparison = a.siteName.localeCompare(b.siteName);
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

    this.filteredLocations = filtered;

    // Debugging logs
    console.log('Selected Site Filter:', this.selectedSiteFilter);
    console.log('Filtered Locations:', this.filteredLocations);
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

  openDialog(location?: EnrichedLocation): void {
    console.log('Editing location:', location); 
    this.editingLocation = location || null;

    if (location) {
      this.locationForm.patchValue({
        name: location.name,
        siteId: location.siteId, // Use the enriched siteId
        displayColor: location.displayColor,
      });
    } else {
      this.locationForm.reset({
        name: '',
        siteId: '',
        displayColor: '#FFFFFF',
      });
    }

    this.showDialog = true;
  }

  closeDialog(): void {
    this.showDialog = false;
    this.editingLocation = null;
  }

  confirmDelete(location: Location): void {
    this.locationToDelete = location;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.locationToDelete = null;
  }

  deleteLocation(): void {
    if (!this.locationToDelete) return;

    this.isLoading = true;

    this.locationService.deleteLocation(this.locationToDelete.locationId).subscribe({
      next: () => {
        this.locations = this.locations.filter(
          (l) => l.locationId !== this.locationToDelete!.locationId
        );
        this.applyFilters();
        this.isLoading = false;
        this.showDeleteConfirm = false;
        this.locationToDelete = null;

        this.notificationService.add({
          message: 'Location deleted successfully',
          type: 'success',
          icon: 'fas fa-check-circle',
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.showDeleteConfirm = false;

        this.notificationService.add({
          message: 'Failed to delete location: ' + error.message,
          type: 'error',
          icon: 'fas fa-exclamation-circle',
        });
      },
    });
  }

  submitForm(): void {
    if (this.locationForm.invalid) {
      Object.keys(this.locationForm.controls).forEach((key) => {
        const control = this.locationForm.get(key);
        control?.markAsTouched();
      });
      return;
    }
  
    this.isSubmitting = true;
    const formValues = this.locationForm.value;
  
    if (this.editingLocation) {
      // Update existing location
      const updatedLocation = {
        name: formValues.name,
        siteId: formValues.siteId,
        displayColor: formValues.displayColor,
      };
      
      this.locationService.updateLocation(this.editingLocation.locationId, updatedLocation)
        .subscribe({
          next: (location) => {
            const index = this.locations.findIndex(
              l => l.locationId === this.editingLocation!.locationId
            );
            if (index !== -1) {
              this.locations[index] = location;
            }
            this.loadData();
            this.isSubmitting = false;
            this.closeDialog();
            this.notificationService.add({
              message: 'Location updated successfully',
              type: 'success',
              icon: 'fas fa-check-circle',
            });
          },
          error: (error) => {
            this.isSubmitting = false;
            if (error.message.includes('already exists')) {
              this.locationForm.get('name')?.setErrors({ 
                duplicate: error.message 
              });
            }
            this.notificationService.add({
              message: 'Failed to update location: ' + error.message,
              type: 'error',
              icon: 'fas fa-exclamation-circle',
            });
          }
        });
    } else {
      // Create new location
      const newLocation = {
        name: formValues.name,
        siteId: formValues.siteId,
        displayColor: formValues.displayColor,
      };
  
      this.locationService.createLocation(newLocation)
        .subscribe({
          next: (location) => {
            this.locations.unshift(location);
            this.loadData();
            this.isSubmitting = false;
            this.closeDialog();
            this.notificationService.add({
              message: 'Location created successfully',
              type: 'success',
              icon: 'fas fa-check-circle',
            });
          },
          error: (error) => {
            this.isSubmitting = false;
            if (error.message.includes('already exists')) {
              this.locationForm.get('name')?.setErrors({ 
                duplicate: error.message 
              });
            }
            this.notificationService.add({
              message: 'Failed to create location: ' + error.message,
              type: 'error',
              icon: 'fas fa-exclamation-circle',
            });
          }
        });
    }
  }

  getSiteName(siteId: number): string {
    const site = this.sites.find((s) => s.siteId === siteId);
    return site ? site.name : '';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}