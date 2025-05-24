// src/app/sara-admin/pages/sensor-assignments/sensor-assignments.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SensorAssignment } from '../../models/sensor-assignment.model';
import { SensorBox } from '../../models/sensor-box.model';
import { SensorType } from '../../models/sensor-type.model';
import { NotificationService } from '../../services/notification.service';
import { SensorAssignmentService } from '../../services/sensor-assignment.service';
import { SensorBoxService } from '../../services/sensor-box.service';
import { SensorTypeService } from '../../services/sensor-type.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
@Component({
  selector: 'app-sensor-assignments',
  templateUrl: './sensor-assignments.component.html',
  styleUrls: ['./sensor-assignments.component.css'],
  standalone:true,
  imports: [CommonModule,FormsModule,ReactiveFormsModule]
})
export class SensorAssignmentsComponent implements OnInit {
  sensorAssignments: SensorAssignment[] = [];
  filteredAssignments: SensorAssignment[] = [];
  sensorBoxes: SensorBox[] = [];
  sensorTypes: SensorType[] = [];
  isLoading = true;
  showDialog = false;
  isSubmitting = false;
  editingAssignment: SensorAssignment | null = null;
  assignmentForm: FormGroup;
  searchTerm = '';
  selectedSensorBoxFilter = 'all';
  selectedSensorTypeFilter = 'all';
  sortField = 'sensorBoxName';
  sortDirection = 'asc';
  showDeleteConfirm = false;
  assignmentToDelete: SensorAssignment | null = null;
  defaultColors = [
    '#FF5733', // Red-Orange
    '#3498DB', // Blue
    '#27AE60', // Green
    '#F1C40F', // Yellow
    '#9B59B6', // Purple
    '#E74C3C', // Red
    '#1ABC9C', // Teal
    '#F39C12'  // Orange
  ];

  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private sensorAssignmentService: SensorAssignmentService,
    private sensorBoxService: SensorBoxService,
    private sensorTypeService: SensorTypeService
  ) {
    this.assignmentForm = this.fb.group({
      sensorBoxId: ['', Validators.required],
      sensorTypeId: ['', Validators.required],
      displayColor: ['#FF5733', [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]]
    }, { validators: this.uniqueAssignmentValidator.bind(this) });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    
    // Load sensor boxes, sensor types, and assignments
    this.sensorBoxService.getSensorBoxes().subscribe(sensorBoxes => {
      this.sensorBoxes = sensorBoxes;
      
      this.sensorTypeService.getSensorTypes().subscribe(sensorTypes => {
        this.sensorTypes = sensorTypes;
        
        this.sensorAssignmentService.getSensorAssignments().subscribe({
          next: (assignments) => {
            this.sensorAssignments = assignments;
            this.applyFilters();
            this.isLoading = false;
          },
          error: (error) => {
            this.isLoading = false;
            this.notificationService.add({
              message: 'Failed to load sensor assignments: ' + error.message,
              type: 'error',
              icon: 'fas fa-exclamation-circle'
            });
          }
        });
      });
    });
  }
  getSensorBoxName(sensorBoxId: number | undefined): string {
    if (!sensorBoxId) return 'Unknown';
    const box = this.sensorBoxes.find(b => b.sensorBoxId === sensorBoxId);
    return box?.agentSerial || 'Unknown';
  }
  
  getSensorTypeName(sensorTypeId: number | undefined): string {
    if (!sensorTypeId) return 'Unknown';
    const type = this.sensorTypes.find(t => t.sensorTypeId === sensorTypeId);
    return type?.name || 'Unknown';
  }
  uniqueAssignmentValidator(group: FormGroup): { [key: string]: any } | null {
    const sensorBoxId = group.get('sensorBoxId')?.value;
    const sensorTypeId = group.get('sensorTypeId')?.value;
  
    // Get the actual names from the boxes/types lists
    const box = this.sensorBoxes.find(b => b.sensorBoxId === sensorBoxId);
    const type = this.sensorTypes.find(t => t.sensorTypeId === sensorTypeId);
    
    if (!box || !type) return null;
  
    // Check if this is an edit operation
    const isSameAsOriginal = this.editingAssignment?.sensorBoxAgentSerial === box.agentSerial && 
                            this.editingAssignment?.sensorTypeName === type.name;
  
    // Allow same box/type combination if it's the original assignment
    const exists = this.sensorAssignments.some(assignment => 
      assignment.sensorBoxAgentSerial === box.agentSerial &&
      assignment.sensorTypeName === type.name &&
      // Exclude the current assignment from the check during edit
      (!this.editingAssignment || assignment.id !== this.editingAssignment.id)
    );
  
    return exists ? { duplicateAssignment: true } : null;
  }

  applyFilters(): void {
    let filtered = [...this.sensorAssignments];
  
    // Filter by sensor box agent serial
    if (this.selectedSensorBoxFilter !== 'all') {
      filtered = filtered.filter(assignment => 
        assignment.sensorBoxAgentSerial === this.selectedSensorBoxFilter
      );
    }
  
    // Filter by sensor type name
    if (this.selectedSensorTypeFilter !== 'all') {
      filtered = filtered.filter(assignment => 
        assignment.sensorTypeName === this.selectedSensorTypeFilter
      );
    }
  
    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(assignment => 
        assignment.sensorBoxAgentSerial.toLowerCase().includes(term) ||
        assignment.sensorTypeName.toLowerCase().includes(term)
      );
    }
  
    // Sorting
    filtered.sort((a, b) => {
      if (this.sortField === 'sensorBoxName') {
        return this.sortDirection === 'asc' 
          ? a.sensorBoxAgentSerial.localeCompare(b.sensorBoxAgentSerial)
          : b.sensorBoxAgentSerial.localeCompare(a.sensorBoxAgentSerial);
      }
      if (this.sortField === 'sensorTypeName') {
        return this.sortDirection === 'asc'
          ? a.sensorTypeName.localeCompare(b.sensorTypeName)
          : b.sensorTypeName.localeCompare(a.sensorTypeName);
      }
      return 0;
    });
  
    this.filteredAssignments = filtered;
  }

  search(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }

  filterBySensorBox(sensorBoxId: string): void {
    this.selectedSensorBoxFilter = sensorBoxId;
    this.applyFilters();
  }
  
  filterBySensorType(sensorTypeId: string): void {
    this.selectedSensorTypeFilter = sensorTypeId;
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

  openDialog(assignment?: SensorAssignment): void {
    this.editingAssignment = assignment || null;
    
    if (assignment) {
      const box = this.sensorBoxes.find(b => b.agentSerial === assignment.sensorBoxAgentSerial);
      const type = this.sensorTypes.find(t => t.name === assignment.sensorTypeName);
      this.assignmentForm.patchValue({
        sensorBoxId: box?.sensorBoxId || '',
        sensorTypeId: type?.sensorTypeId || '',
        displayColor: assignment.displayColor
      });
  
      // Store original values for validation
      this.assignmentForm.get('sensorBoxId')?.setValue(box?.sensorBoxId || '');
      this.assignmentForm.get('sensorTypeId')?.setValue(type?.sensorTypeId || '');
    } else {
      const randomColorIndex = Math.floor(Math.random() * this.defaultColors.length);
      this.assignmentForm.reset({
        sensorBoxId: '',
        sensorTypeId: '',
        displayColor: this.defaultColors[randomColorIndex]
      });
    }
    
    this.showDialog = true;
  }

  closeDialog(): void {
    this.showDialog = false;
    this.editingAssignment = null;
    this.assignmentForm.markAsUntouched();
    this.assignmentForm.updateValueAndValidity();

  }

  confirmDelete(assignment: SensorAssignment): void {
    this.assignmentToDelete = assignment;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.assignmentToDelete = null;
  }

  deleteAssignment(): void {
    if (!this.assignmentToDelete) return;
    
    this.isLoading = true;
    
    this.sensorAssignmentService.deleteSensorAssignment(this.assignmentToDelete.id).subscribe({
      next: () => {
        this.sensorAssignments = this.sensorAssignments.filter(a => a.id !== this.assignmentToDelete!.id);
        this.applyFilters();
        this.isLoading = false;
        this.showDeleteConfirm = false;
        this.assignmentToDelete = null;
        
        this.notificationService.add({
          message: 'Sensor assignment deleted successfully',
          type: 'success',
          icon: 'fas fa-check-circle'
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.showDeleteConfirm = false;
        
        this.notificationService.add({
          message: 'Failed to delete sensor assignment: ' + error.message,
          type: 'error',
          icon: 'fas fa-exclamation-circle'
        });
      }
    });
  }

// sensor-assignments.component.ts
submitForm(): void {
  if (this.assignmentForm.invalid) {
    Object.keys(this.assignmentForm.controls).forEach(key => {
      this.assignmentForm.get(key)?.markAsTouched();
    });
    return;
  }

  this.isSubmitting = true;
  const formValues = this.assignmentForm.value;
  const dto = {
    sensorBoxId: Number(formValues.sensorBoxId),
    sensorTypeId: Number(formValues.sensorTypeId),
    displayColor: formValues.displayColor
  };

  const operation = this.editingAssignment ? 
    this.sensorAssignmentService.updateSensorAssignment(this.editingAssignment.id, dto) :
    this.sensorAssignmentService.createSensorAssignment(dto);

  operation.subscribe({
    next: (assignment) => {
      this.handleSuccess();
    },
    error: (error) => {
      this.handleError(error);
    }
  });
}

private handleSuccess(): void {
  this.loadData();
  this.isSubmitting = false;
  this.closeDialog();
  this.notificationService.add({
    message: `Sensor assignment ${this.editingAssignment ? 'updated' : 'created'} successfully`,
    type: 'success',
    icon: 'fas fa-check-circle'
  });
}

private handleError(error: any): void {
  this.isSubmitting = false;
  
  if (error.status === 409) {
    this.assignmentForm.setErrors({ duplicateAssignment: error.error });
  } else {
    this.notificationService.add({
      message: error.error?.message || error.message,
      type: 'error',
      icon: 'fas fa-exclamation-circle'
    });
  }
}

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }
}