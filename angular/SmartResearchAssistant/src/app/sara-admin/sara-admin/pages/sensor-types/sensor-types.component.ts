// src/app/sara-admin/pages/sensor-types/sensor-types.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SensorType } from '../../models/sensor-type.model';
import { NotificationService } from '../../services/notification.service';
import { SensorTypeService } from '../../services/sensor-type.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DatePipe } from '@angular/common';
@Component({
  selector: 'app-sensor-types',
  templateUrl: './sensor-types.component.html',
  styleUrls: ['./sensor-types.component.css'],
  standalone: true,
  imports: [
    CommonModule,     
    ReactiveFormsModule, 
    RouterModule,      
  ],
  providers: [DatePipe]
})
export class SensorTypesComponent implements OnInit {
  sensorTypes: SensorType[] = [];
  filteredSensorTypes: SensorType[] = [];
  isLoading = true;
  showDialog = false;
  isSubmitting = false;
  editingSensorType: SensorType | null = null;
  sensorTypeForm: FormGroup;
  searchTerm = '';
  sortField = 'name';
  sortDirection = 'asc';
  showDeleteConfirm = false;
  sensorTypeToDelete: SensorType | null = null;

  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private sensorTypeService: SensorTypeService,
    private datePipe: DatePipe
  ) {
    this.sensorTypeForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      unit: ['', [Validators.required, Validators.maxLength(20)]],
      displayColor: ['#000000', [Validators.required]], 
    }, { validators: this.minMaxValidator });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    
    this.sensorTypeService.getSensorTypes().subscribe({
      next: (sensorTypes) => {
        // Map backend response to frontend interface
        this.sensorTypes = sensorTypes.map((st: any) => ({
          id: st.sensorTypeId.toString(),
          name: st.name,
          unit: st.unit,
          displayColor: st.displayColor,
          usageCount: st.usage,
          created: st.createdAt
        }));
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.add({
          message: 'Failed to load sensor types: ' + error.message,
          type: 'error',
          icon: 'fas fa-exclamation-circle'
        });
      }
    });
  }

  minMaxValidator(group: FormGroup): { [key: string]: any } | null {
    const minValue = group.get('minValue')?.value;
    const maxValue = group.get('maxValue')?.value;
    
    if (minValue !== null && maxValue !== null && Number(minValue) >= Number(maxValue)) {
      return { minMaxError: true };
    }
    
    return null;
  }

  applyFilters(): void {
    let filtered = [...this.sensorTypes];
    
    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(sensorType => 
        sensorType.name.toLowerCase().includes(term) || 
        sensorType.unit.toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'unit':
          comparison = a.unit.localeCompare(b.unit);
          break;
        case 'usageCount':
          comparison = a.usageCount - b.usageCount;
          break;
      }
      
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
    
    this.filteredSensorTypes = filtered;
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

  openDialog(sensorType?: SensorType): void {
    this.editingSensorType = sensorType || null;
    
    if (sensorType) {
      this.sensorTypeForm.patchValue({
        name: sensorType.name,
        unit: sensorType.unit,
        displayColor: sensorType.displayColor,
      });
    } else {
      this.sensorTypeForm.reset({
        name: '',
        unit: '',
        minValue: 0,
        maxValue: 100,
        description: ''
      });
    }
    
    this.showDialog = true;
  }

  closeDialog(): void {
    this.showDialog = false;
    this.editingSensorType = null;
  }

  confirmDelete(sensorType: SensorType): void {
    this.sensorTypeToDelete = sensorType;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.sensorTypeToDelete = null;
  }

  deleteSensorType(): void {
    if (!this.sensorTypeToDelete) return;
    
    this.isLoading = true;
    
    this.sensorTypeService.deleteSensorType(
      this.sensorTypeToDelete.id // Directly use the number
    ).subscribe({
      next: () => {
        this.loadData(); // Refresh data
        this.isLoading = false;
        this.showDeleteConfirm = false;
        this.sensorTypeToDelete = null;
        this.notificationService.add({
          message: 'Sensor type deleted successfully',
          type: 'success',
          icon: 'fas fa-check-circle'
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.showDeleteConfirm = false;
        this.notificationService.add({
          message: 'Failed to delete sensor type: ' + error.message,
          type: 'error',
          icon: 'fas fa-exclamation-circle'
        });
      }
    });
  }

// sensor-types.component.ts
submitForm(): void {
  if (this.sensorTypeForm.invalid) {
    Object.keys(this.sensorTypeForm.controls).forEach(key => {
      this.sensorTypeForm.get(key)?.markAsTouched();
    });
    return;
  }

  this.isSubmitting = true;
  const formValues = this.sensorTypeForm.value;

  if (this.editingSensorType) {
    // Update existing
    this.sensorTypeService.updateSensorType(
      +this.editingSensorType.id,
      {
        name: formValues.name,
        unit: formValues.unit,
        displayColor: formValues.displayColor
      }
    ).subscribe({
      next: () => {
        this.handleSuccess('updated');
      },
      error: (error) => {
        this.handleError(error, 'update');
      }
    });
  } else {
    // Create new
    this.sensorTypeService.createSensorType({
      name: formValues.name,
      unit: formValues.unit,
      displayColor: formValues.displayColor
    }).subscribe({
      next: () => {
        this.handleSuccess('created');
      },
      error: (error) => {
        this.handleError(error, 'create');
      }
    });
  }
}

private handleSuccess(action: string): void {
  this.loadData();
  this.isSubmitting = false;
  this.closeDialog();
  this.notificationService.add({
    message: `Sensor type ${action} successfully`,
    type: 'success',
    icon: 'fas fa-check-circle'
  });
}

private handleError(error: any, action: string): void {
  this.isSubmitting = false;
  const nameControl = this.sensorTypeForm.get('name');

  if (error.status === 409) {
    const errorMessage = error.error?.message || 'Sensor type with this name already exists';
    nameControl?.setErrors({ duplicate: errorMessage });
    nameControl?.markAsTouched();
  } else {
    this.notificationService.add({
      message: `Failed to ${action} sensor type: ${error.error?.message || error.message}`,
      type: 'error',
      icon: 'fas fa-exclamation-circle'
    });
  }
}
  formatDate(dateString: string): string {
    return this.datePipe.transform(dateString, 'MM/dd/yyyy') || '';
  }
    }
  