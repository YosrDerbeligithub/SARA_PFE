import { Component, EventEmitter, Input, OnInit, Output, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SchemaViewerComponent } from './schema-viewer/schema-viewer.component';
import { DataPreviewTableComponent } from './data-preview-table/data-preview-table.component';
import { DatasetService } from '../../services/dataset.service';
import { DatasetDetails, VisibilityType, Collaborator } from '../../models/dataset.model';
import { switchMap } from 'rxjs/operators';
import { AppbarComponent } from '../../appbar/appbar.component';
import { lastValueFrom } from 'rxjs';
@Component({
  selector: 'app-dataset-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SchemaViewerComponent,
    DataPreviewTableComponent,
    AppbarComponent
  ],
  templateUrl: './dataset-details.component.html',
  styleUrls: ['./dataset-details.component.css']
})
export class DatasetDetailsComponent implements OnInit {
  @Input() datasetId!: string;
  @Output() backToList = new EventEmitter<void>();
  
  
  dataset: DatasetDetails | null = null;
  isLoading = false;
  error: string | null = null;
  activeTab = 'data';
  isEditingSchema = false;
  newCollaborator = '';
  isDeleting = false;
 selectedVisibility: VisibilityType | null = null;
pendingCollaborators: Collaborator[] = [];
existingPendingCollaborators: Collaborator[] = [];
originalCollaborators: Collaborator[] = [];

 
  constructor(private datasetService: DatasetService, private cdr: ChangeDetectorRef) {}


  ngOnInit() {
    this.loadDataset();
  }
  
  public loadDataset() {
    this.isLoading = true;
    this.error = null;
    this.datasetService.getDatasetDetails(this.datasetId).subscribe({
next: (data) => {
        const collaborators = (data.collaborators || []).map((c: { email?: string; id?: { collaboratorEmail?: string } } | string) => 
        typeof c === 'string' ? { email: c } : 
        c.email ? { email: c.email } : 
        { email: c.id?.collaboratorEmail || '' }
      );
  this.dataset = {
    ...data,
    collaborators
  };
  this.originalCollaborators = [...collaborators];
  this.existingPendingCollaborators = [...collaborators];
  console.log('Loaded collaborators:',[...collaborators]);
  this.isLoading = false;
},
      error: (err) => {
        this.error = err.message;
        this.isLoading = false;
      }
    });
  }
  
  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
  
  toggleSchemaEdit() {
    this.isEditingSchema = !this.isEditingSchema;
  }
  
updateVisibility(visibility: VisibilityType) {
  if (!this.dataset) return;

const collaborators = this.existingPendingCollaborators.map(c => c.email);

  if (visibility === 'RESTRICTED' && collaborators.length === 0) {
    this.error = 'You must add at least one collaborator for restricted visibility';
    return;
  }

  const previousVisibility = this.dataset.visibility;
  this.dataset.visibility = visibility;

  this.datasetService.updateVisibility(this.datasetId, visibility).subscribe({
    next: (updated) => {
      this.dataset!.visibility = updated.visibility;
      this.loadDataset();
    },
    error: (err) => {
      this.dataset!.visibility = previousVisibility;
      console.error('Update failed:', err);
      this.error = `Failed to update visibility: ${err.message}`;
    }
  });
}

addCollaborator() {
  if (!this.newCollaborator || !this.isValidEmail(this.newCollaborator)) return;

  const newCollaborator = { 
    email: this.newCollaborator.trim().toLowerCase() 
  };

  // Check for duplicates
  if (!this.pendingCollaborators.some(c => c.email === newCollaborator.email)) {
    this.pendingCollaborators = [...this.pendingCollaborators, newCollaborator];
  }
  
  this.newCollaborator = '';
}

addPendingCollaborator() {
  if (!this.newCollaborator || !this.isValidEmail(this.newCollaborator)) return;

  const newCollaborator = { 
    email: this.newCollaborator.trim().toLowerCase() 
  };

  if (!this.pendingCollaborators.some(c => c.email === newCollaborator.email)) {
    this.pendingCollaborators = [...this.pendingCollaborators, newCollaborator];
  }
  
  this.newCollaborator = '';
}

removePendingCollaborator(email: string) {
  this.pendingCollaborators = this.pendingCollaborators.filter(c => c.email !== email);
}

async confirmCollaborators() {
  if (!this.dataset) return;

  try {
    const collaboratorEmails = this.pendingCollaborators.map(c => c.email);
   
    // Update both visibility and collaborators in one request
    const updatedDataset = await lastValueFrom(
      this.datasetService.updateVisibility(
        this.datasetId,
        'RESTRICTED',
        collaboratorEmails
      )
    );

    if (updatedDataset) {
      // Properly map collaborators to Collaborator objects
this.dataset = {
  ...updatedDataset,
  collaborators: (updatedDataset.collaborators || []).map((c: Collaborator) => ({
    email: c.email
  }))
};
     
      // Update both collaborator lists
      this.existingPendingCollaborators = [...this.dataset.collaborators];
      this.pendingCollaborators = [];
     
      this.selectedVisibility = null;
      this.datasetService.triggerDatasetRefresh();
    }
  } catch (err) {
    console.error('Update failed:', err);
    this.error = 'Failed to update visibility and collaborators. Please try again.';
    this.pendingCollaborators = [];
  }
}
trackByCollaborator(index: number, collaborator: Collaborator | string): string {
  return typeof collaborator === 'string' ? collaborator : collaborator.email;
}

cancelCollaborators() {
  this.selectedVisibility = null;
  this.pendingCollaborators = [];
  this.newCollaborator = '';
}
isValidEmail(email: string): boolean {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  return emailPattern.test(email);
}  
removeCollaborator(email: string) {
  if (!this.dataset) return;

  const updatedEmails = this.dataset.collaborators
    .filter(c => c.email !== email)
    .map(c => c.email);

  this.datasetService.updateCollaborators(this.datasetId, updatedEmails)
    .subscribe({
      next: (updated) => {
        this.dataset!.collaborators = updated.collaborators;
        this.existingPendingCollaborators = updated.collaborators;
      },
      error: (err) => console.error('Remove failed:', err)
    });
}
  
  updateSchema(schema: any) {
    if (!this.dataset) return;
    
    this.datasetService.updateSchema(this.datasetId, schema)
      .subscribe({
        next: (updatedDataset) => {
          this.loadDataset(); // Reload to get updated schema and data
          this.isEditingSchema = false;
        },
        error: (err) => {
          // Handle error, show notification
          console.error('Failed to update schema:', err);
        }
      });
  }
  
  confirmDelete() {
    this.isDeleting = true;
  }
  
  cancelDelete() {
    this.isDeleting = false;
  }
  
  deleteDataset() {
    if (!this.dataset) return;
    
    this.datasetService.deleteDataset(this.datasetId)
      .subscribe({
        next: () => {
          this.backToList.emit();
        },
        error: (err) => {
          // Handle error, show notification
          console.error('Failed to delete dataset:', err);
          this.isDeleting = false;
        }
      });
  }
  
  formatDate(date: string | Date): string {
    const parsedDate = typeof date === 'string' ? new Date(date) : date;
    return parsedDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
onRestrictedSelected() {
  if (this.dataset?.visibility !== 'RESTRICTED') {
    this.selectedVisibility = 'RESTRICTED';
    this.pendingCollaborators = [...this.dataset?.collaborators || []];
  }
  this.error = null;
}
addExistingCollaborator() {
  if (!this.newCollaborator || !this.isValidEmail(this.newCollaborator)) return;

  const newEmail = this.newCollaborator.trim().toLowerCase();
  const existingEmails = [
    ...this.dataset?.collaborators.map(c => c.email) || [],
    ...this.existingPendingCollaborators.map(c => c.email)
  ];

  if (!existingEmails.includes(newEmail)) {
    // Create new array to trigger change detection
    this.existingPendingCollaborators = [
      ...this.existingPendingCollaborators,
      { email: newEmail }
    ];
  }
  this.newCollaborator = '';
}


removeExistingPendingCollaborator(email: string) {
  this.existingPendingCollaborators = this.existingPendingCollaborators.filter(c => c.email !== email);
}

resetOriginalCollaborators() {
  this.originalCollaborators = [...this.existingPendingCollaborators];
}

// Compare arrays by email
hasExistingCollaboratorChanges(): boolean {
  if (this.originalCollaborators.length !== this.existingPendingCollaborators.length) return true;
  const origEmails = this.originalCollaborators.map(c => c.email).sort();
  const currEmails = this.existingPendingCollaborators.map(c => c.email).sort();
  return !origEmails.every((email, i) => email === currEmails[i]);
}

async confirmExistingCollaborators() {
  if (!this.dataset) return;

  try {
    const emails = this.existingPendingCollaborators.map(c => c.email);

    const updatedDataset = await this.datasetService
      .updateCollaborators(this.datasetId, emails)
      .toPromise();
    if (updatedDataset) {
      this.error = null;
      this.dataset = {
        ...updatedDataset,
        collaborators: updatedDataset.collaborators
      };
      this.existingPendingCollaborators = [...updatedDataset.collaborators];
      this.datasetService.triggerDatasetRefresh();
      this.loadDataset();
    }
  } catch (err: any) {
    console.error('Update error:', err);
    this.error = err.message.includes('An error occurred') 
      ? 'Failed to save collaborators. Please try again.'
      : err.message;
    this.existingPendingCollaborators = [...this.dataset.collaborators];
  }


}}