// src/app/sara-admin/pages/sensor-boxes/sensor-boxes.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SensorBox, SensorBoxStatus } from '../../models/sensor-box.model';
import { Location } from '../../models/location.model';
import { Site } from '../../models/site.model';
import { NotificationService } from '../../services/notification.service';
import { SensorBoxService } from '../../services/sensor-box.service';
import { LocationService } from '../../services/location.service';
import { SiteService } from '../../services/site.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DatePipe } from '@angular/common';

// Define an enriched type that extends SensorBox with additional properties
type EnrichedSensorBox = SensorBox & {
  locationId: number;
  siteName: string;
};

@Component({
  selector: 'app-sensor-boxes',
  templateUrl: './sensor-boxes.component.html',
  styleUrls: ['./sensor-boxes.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  providers: [DatePipe],
})
export class SensorBoxesComponent implements OnInit {
  sensorBoxes: EnrichedSensorBox[] = [];
  filteredSensorBoxes: EnrichedSensorBox[] = [];
  locations: Location[] = [];
  sites: Site[] = [];
  isLoading = true;
  showDialog = false;
  isSubmitting = false;
  editingSensorBox: EnrichedSensorBox | null = null;
  sensorBoxForm: FormGroup;
  searchTerm = '';
  selectedSiteFilter = 'all';
  selectedLocationFilter = 'all';
  selectedStatusFilter = 'all';
  sortField = 'agentSerial';
  sortDirection = 'asc';
  showDeleteConfirm = false;
  sensorBoxToDelete: EnrichedSensorBox | null = null;
  filteredLocations: Location[] = [];

  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private sensorBoxService: SensorBoxService,
    private locationService: LocationService,
    private siteService: SiteService,
    private datePipe: DatePipe
  ) {
    this.sensorBoxForm = this.fb.group({
      agentSerial: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9\-]+$/)]],
      locationId: ['', Validators.required],
      displayColor: ['#FFFFFF', Validators.required],
      status: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;

    // Fetch sites, locations, and sensor boxes
    this.siteService.getSites().subscribe({
      next: (sites) => {
        this.sites = sites;

        this.locationService.getLocations().subscribe({
          next: (locations) => {
            this.locations = locations;
            this.updateFilteredLocations();

            this.sensorBoxService.getSensorBoxes().subscribe({
              next: (sensorBoxes) => {
                // Enrich sensor boxes with locationId and siteName
                this.sensorBoxes = sensorBoxes.map((sensorBox) => {
                  const location = this.locations.find(
                    (loc) => loc.name === sensorBox.locationName
                  );
                  const siteName = location?.siteName || sensorBox.siteName;

                  return {
                    ...sensorBox, // Keep original siteName and createdAt from API
                    locationId: location ? location.locationId : 0, // Only add locationId
                    siteName: siteName 
                  };
                });
                this.applyFilters();
                this.isLoading = false;
              },
              error: (error) => {
                console.error('Failed to load sensor boxes:', error);
                this.isLoading = false;
              },
            });
          },
          error: (error) => {
            console.error('Failed to load locations:', error);
            this.isLoading = false;
          },
        });
      },
      error: (error) => {
        console.error('Failed to load sites:', error);
        this.isLoading = false;
      },
    });
  }

  updateFilteredLocations(): void {
    if (this.selectedSiteFilter === 'all') {
      this.filteredLocations = [...this.locations];
    } else {
      const selectedSiteId = Number(this.selectedSiteFilter); // Convert to number
      this.filteredLocations = this.locations.filter(
        (location) => location.siteId === selectedSiteId 
      );
    }
  }

  applyFilters(): void {
    let filtered = [...this.sensorBoxes];

    // Apply site filter
    if (this.selectedSiteFilter !== 'all') {
      const selectedSite = this.sites.find(
        site => site.siteId === Number(this.selectedSiteFilter)
      );
      
      if (selectedSite) {
        filtered = filtered.filter(
          sensorBox => sensorBox.siteName === selectedSite.name
        );
      }
    }

    // Apply location filter
    if (this.selectedLocationFilter !== 'all') {
      filtered = filtered.filter(
        (sensorBox) => sensorBox.locationId === Number(this.selectedLocationFilter)
      );
    }

    // Apply status filter
    if (this.selectedStatusFilter !== 'all') {
      filtered = filtered.filter(
        (sensorBox) => sensorBox.status === this.selectedStatusFilter
      );
    }

    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (sensorBox) =>
          sensorBox.agentSerial.toLowerCase().includes(term) ||
          sensorBox.locationName.toLowerCase().includes(term) ||
          sensorBox.siteName.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (this.sortField) {
        case 'agentSerial':
          comparison = a.agentSerial.localeCompare(b.agentSerial);
          break;
        case 'locationName':
          comparison = a.locationName.localeCompare(b.locationName);
          break;
        case 'siteName':
          comparison = a.siteName.localeCompare(b.siteName);
          break;
        case 'sensorCount':
          comparison = a.sensorCount - b.sensorCount;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'createdAt':
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });

    this.filteredSensorBoxes = filtered;
  }

  search(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }

  filterBySite(siteId: string): void {
    this.selectedSiteFilter = siteId;
    this.selectedLocationFilter = 'all'; // Reset location filter when site changes
    this.updateFilteredLocations();
    this.applyFilters();

    if (siteId === 'all') {
      this.filteredLocations = [...this.locations];
    } else {
      const selectedSite = this.sites.find(s => s.siteId === Number(siteId));
      this.filteredLocations = this.locations.filter(
        loc => loc.siteName === selectedSite?.name   
      );
    }
  }

  filterByLocation(locationId: string): void {
    this.selectedLocationFilter = locationId;
    this.applyFilters();
  }

  filterByStatus(status: string): void {
    this.selectedStatusFilter = status;
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

  openDialog(sensorBox?: EnrichedSensorBox): void {
    this.editingSensorBox = sensorBox || null;

    if (sensorBox) {
      this.sensorBoxForm.patchValue({
        agentSerial: sensorBox.agentSerial,
        locationId: sensorBox.locationId,
        displayColor: sensorBox.displayColor,
        status: sensorBox.status,
      });
    } else {
      this.sensorBoxForm.reset({
        agentSerial: '',
        locationId: this.selectedLocationFilter !== 'all' ? this.selectedLocationFilter : '',
        displayColor: '#FFFFFF',
        status: '',
      });
    }

    this.showDialog = true;
  }

  closeDialog(): void {
    this.showDialog = false;
    this.editingSensorBox = null;
  }

  confirmDelete(sensorBox: EnrichedSensorBox): void {
    this.sensorBoxToDelete = sensorBox;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.sensorBoxToDelete = null;
  }

  deleteSensorBox(): void {
    if (!this.sensorBoxToDelete) return;

    this.isLoading = true;

    this.sensorBoxService.deleteSensorBox(this.sensorBoxToDelete.sensorBoxId).subscribe({
      next: () => {
        this.sensorBoxes = this.sensorBoxes.filter(
          (sb) => sb.sensorBoxId !== this.sensorBoxToDelete!.sensorBoxId
        );
        this.applyFilters();
        this.isLoading = false;
        this.showDeleteConfirm = false;
        this.sensorBoxToDelete = null;

        this.notificationService.add({
          message: 'Sensor box deleted successfully',
          type: 'success',
          icon: 'fas fa-check-circle',
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.showDeleteConfirm = false;

        this.notificationService.add({
          message: 'Failed to delete sensor box: ' + error.message,
          type: 'error',
          icon: 'fas fa-exclamation-circle',
        });
      },
    });
  }

// sensor-boxes.component.ts
submitForm(): void {
  if (this.sensorBoxForm.invalid) {
    Object.keys(this.sensorBoxForm.controls).forEach((key) => {
      const control = this.sensorBoxForm.get(key);
      control?.markAsTouched();
    });
    return;
  }

  this.isSubmitting = true;
  const formValues = this.sensorBoxForm.value;
  const locationId = Number(formValues.locationId);

  const operation = this.editingSensorBox ?
    this.sensorBoxService.updateSensorBox(this.editingSensorBox.sensorBoxId, {
      agentSerial: formValues.agentSerial,
      locationId: locationId,
      displayColor: formValues.displayColor
    }) :
    this.sensorBoxService.createSensorBox({
      agentSerial: formValues.agentSerial,
      locationId: locationId,
      displayColor: formValues.displayColor
    });

  operation.subscribe({
    next: (sensorBox) => {
      // Success handling
      const location = this.locations.find(l => l.locationId === locationId);
      const site = this.sites.find(s => s.siteId === location?.siteId);

      if (this.editingSensorBox) {
        // Update existing
        const index = this.sensorBoxes.findIndex(
          sb => sb.sensorBoxId === this.editingSensorBox!.sensorBoxId
        );
        if (index !== -1) {
          this.sensorBoxes[index] = {
            ...sensorBox,
            locationId: locationId,
            locationName: location?.name || '',
            siteName: site?.name || '',
            status: this.editingSensorBox.status
          };
        }
      } else {
        // Create new
        this.sensorBoxes.unshift({
          ...sensorBox,
          locationId: locationId,
          locationName: location?.name || '',
          siteName: site?.name || '',
          status: 'active', // Default status
          sensorCount: 0
        });
      }

      this.applyFilters();
      this.isSubmitting = false;
      this.closeDialog();
      this.notificationService.add({
        message: `Sensor box ${this.editingSensorBox ? 'updated' : 'created'} successfully`,
        type: 'success',
        icon: 'fas fa-check-circle'
      });
    },
    error: (error) => {  // <--- REPLACE THIS EXISTING ERROR HANDLER
      this.isSubmitting = false;
      
      // Handle duplicate error based on status code
      if (error.status === 409) {
        const errorMessage = error.error?.message || 'Serial number already exists';
        const agentSerialControl = this.sensorBoxForm.get('agentSerial');
        if (agentSerialControl) {
          agentSerialControl.setErrors({ duplicate: errorMessage });
          agentSerialControl.markAsTouched(); // Ensure control is marked as touched
          agentSerialControl.markAsDirty();   // Optional but helps with some UI frameworks
        }
      }
  
      this.notificationService.add({
        message: error.error?.message || 'An error occurred',
        type: 'error',
        icon: 'fas fa-exclamation-circle'
      });
    }
  });
}

  getStatusBadgeClass(status: String): string {
    switch (status) {
      case 'active':
        return 'badge badge-active';
      case 'inactive':
        return 'badge badge-inactive';
      case 'maintenance':
        return 'badge badge-maintenance';
      default:
        return 'badge badge-inactive';
    }
  }

  formatDate(dateString: string): string {
    return this.datePipe.transform(dateString, 'MM/dd/yyyy') || '';
  }
}