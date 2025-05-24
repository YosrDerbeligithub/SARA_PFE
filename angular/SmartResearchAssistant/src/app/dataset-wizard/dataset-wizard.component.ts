import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataTabComponent } from './data-tab/data-tab.component';
import { SchemaTabComponent } from './schema-tab/schema-tab.component';
import { PreviewTabComponent } from './preview-tab/preview-tab.component';
import { SidebarService } from '../services/sidebar.service';
import { VisibilityType } from '../models/dataset.model';
import { ValidationError } from '../services/validation.service';
import { DatasetService } from '../services/dataset.service';
import { AuthService } from '../services/auth.service';
import { AppbarComponent } from "../appbar/appbar.component";

@Component({
  selector: 'app-dataset-wizard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataTabComponent,
    SchemaTabComponent,
    PreviewTabComponent,
    AppbarComponent
],
  templateUrl: './dataset-wizard.component.html',
  styleUrls: ['./dataset-wizard.component.css']
})
export class DatasetWizardComponent {
  
  private datasetService = inject(DatasetService);
  private authService = inject(AuthService);
  datasetName = '';
  datasetDescription = '';
  
  activeTab = 'data';
  dataUploaded = false;
  schemaValid = false;
  showInvalidSchema = false;
  visibility: VisibilityType = 'PRIVATE';
  collaborators: string[] = [];
  parsedData: any[] = []; 
  jsonContent: string = '';

  validationErrors: ValidationError[] = [];
  schemaInput: string = '';

  get canCreateDataset(): boolean {
    return !!this.schemaInput.trim()&&!!this.datasetName.trim() && 
           !!this.datasetDescription.trim() && 
           this.dataUploaded &&
           (this.visibility !== 'RESTRICTED' || (this.collaborators && this.collaborators.length > 0));;
  }
  
  async handleCreateDataset() {
  // Convert schema input to JSON or null
  let schema: any = null;
  if (this.visibility === 'RESTRICTED' && 
    (!this.collaborators || this.collaborators.length === 0)) {
  alert('Collaborators are required for restricted visibility');
  return;
}
  try {
    if (this.schemaInput.trim()) {
      schema = JSON.parse(this.schemaInput);
    } else {
      schema = null;
    }
  } catch (e) {
    alert('Invalid JSON schema format');
    return;
  }

  const datasetPayload: {
    name: string;
    description: string;
    payload: any[];
    schema: any;
    visibility: VisibilityType;
    collaborators?: string[];
  } = {
    name: this.datasetName,
    description: this.datasetDescription, 
    payload: this.parsedData,
    schema: schema,
    visibility: this.visibility
  };
  if (this.visibility === 'RESTRICTED') {
    datasetPayload.collaborators = this.collaborators;
  }

    try {
      // You'll need to get the actual user ID from your auth system
      const userId = this.authService.currentUser?.user.id;
      if (!userId) {
        console.error('User ID not found in authService');
        return;
      }
      console.log('Creating dataset with payload:', datasetPayload);
      const response = await this.datasetService.createDataset(datasetPayload, userId).toPromise();
      console.log('Dataset created:', response);
      alert('Dataset created successfully!');

      // Handle success (redirect, show message, etc.)
    } catch (error) {
      console.error('Dataset creation failed:', error);
      const errorMessage = (error instanceof Error) ? error.message : 'Unknown error';
      alert(`Dataset creation failed: ${errorMessage}`);

      // Handle error
    }
  }




  setActiveTab(tab: string) {
    if (tab === 'schema' && !this.dataUploaded) {
      return;
    }
    
    if (tab === 'preview' && !this.schemaValid && !this.dataUploaded) {
      return;
    }
    
    this.activeTab = tab;
  }
  
  onDataUploaded(value: boolean) {
    this.dataUploaded = value;
    console.log('Data uploaded:', this.dataUploaded);
  }
  onDataParsed(data: any) {
    this.parsedData = Array.isArray(data) ? data : [data];
    console.log('Received parsed data in parent:', data);
  }
  
  onSchemaValidChange(value: boolean) {
    this.schemaValid = value;
    console.log('Schema valid changed to:', this.schemaValid);
  }
  
  onShowInvalidSchemaChange(value: boolean) {
    this.showInvalidSchema = value;
    if (value) {
      this.schemaValid = false;
    }
  }
  
  onVisibilityChange(value: VisibilityType) {
    this.visibility = value;
    console.log('Visibility changed to:', this.visibility);
  }
  
  onCollaboratorsChange(value: string[]) {
    this.collaborators = value;
    console.log('Collaborators changed to:', this.collaborators);
  }

  onValidationErrorsChange(errors: ValidationError[]) {
    this.validationErrors = errors;
    console.log('Validation errors changed:', this.validationErrors);
  }

  onSchemaInputChange(value: string) {
    this.schemaInput = value;
  }
  onJsonContentChange(content: string) {
    this.jsonContent = content;
    console.log('JSON content updated in parent:', content);
  }
}