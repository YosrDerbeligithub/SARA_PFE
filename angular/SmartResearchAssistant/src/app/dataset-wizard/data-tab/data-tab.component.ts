import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VisibilityType } from '../../models/dataset.model';
import * as Papa from 'papaparse';


@Component({
  selector: 'app-data-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './data-tab.component.html',
  styleUrls: ['./data-tab.component.css']
})
export class DataTabComponent {
  @Input() datasetName = '';
  @Input() jsonContent: string = '';
  @Input() parsedData: any[] = [];  


  @Input() dataUploaded = false;
  @Input() visibility: VisibilityType = 'PRIVATE';
  @Input() collaborators: string[] = [];
  @Input() datasetDescription = '';

  
  @Output() dataUploadedChange = new EventEmitter<boolean>();
  @Output() visibilityChange = new EventEmitter<VisibilityType>();
  @Output() collaboratorsChange = new EventEmitter<string[]>();
  @Output() nextStep = new EventEmitter<void>();
  @Output() dataParsed = new EventEmitter<any>();
  @Output() datasetNameChange = new EventEmitter<string>();
  @Output() jsonContentChange = new EventEmitter<string>(); 
  @Output() datasetDescriptionChange = new EventEmitter<string>();


  
  newCollaborator = '';
  uploadedFile: File | null = null; // Variable to store the uploaded file

  
  onDescriptionChange(desc: string) {
    this.datasetDescriptionChange.emit(desc);
  }
  onNameChange(name: string) {
    this.datasetNameChange.emit(name);
    console.log('Dataset name changed:', name);
  }

  handleUpload() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv,application/json';
    fileInput.multiple = false; // Ensure single file selection
    
    fileInput.onchange = async (event: Event) => {
      const input = event.target as HTMLInputElement;
      if (input.files && input.files.length > 0) {
        const file = input.files[0];
        this.uploadedFile = file;
        await this.processFile(file);
      }
    };
    fileInput.click();
  }

  private async processFile(file: File) {
    const content = await file.text();
    
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      this.parseCSV(content);
    } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
      this.parseJSON(content);
    }
  }

  private parseCSV(csvContent: string) {
    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<any>) => {
        if (results.errors.length === 0) {
          this.handleSuccessfulParse(results.data);
        } else {
          alert('Error parsing CSV: ' + results.errors[0].message);
        }
      }
    });
  }

  private parseJSON(jsonContent: string) {
    try {
      const parsedData = JSON.parse(jsonContent);
      this.handleSuccessfulParse(parsedData);
    } catch (e) {
      alert('Invalid JSON format');
    }
  }

  // Handle JSON textarea input
  handleJsonInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.jsonContent = target.value;
    this.jsonContentChange.emit(this.jsonContent); // Emit changes to parent

    
    if (this.jsonContent.trim()) {
      try {
        const parsedData = JSON.parse(this.jsonContent);
        this.handleSuccessfulParse(parsedData);
      } catch (e) {
        // Don't alert here to allow typing
      }
    }
  }

  formatJson() {
    console.log('Formatting JSON:', this.jsonContent);
    if (this.jsonContent.trim()) { // Check if the content is not empty or whitespace
      try {
        const parsed = JSON.parse(this.jsonContent);
        this.jsonContent = JSON.stringify(parsed, null, 2);
        this.jsonContentChange.emit(this.jsonContent); // Emit formatted JSON to parent
        // Format JSON with indentation
        this.handleSuccessfulParse(parsed); // Emit parsed data
      } catch (e) {
        alert('Invalid JSON format');
      }
    } else {
      alert('JSON content is empty or invalid');
    }
  }

  private handleSuccessfulParse(data: any) {
    this.dataUploaded = true;
    this.dataUploadedChange.emit(true);
    this.dataParsed.emit(data); // Emit parsed data to parent
    console.log('Parsed data:', data);
  }

  handleVisibilityChange(value: VisibilityType) {
    this.visibility = value;
    this.visibilityChange.emit(value);
  }

  addCollaborator() {
    if (this.newCollaborator && !this.collaborators.includes(this.newCollaborator)) {
      const updatedCollaborators = [...this.collaborators, this.newCollaborator];
      this.collaborators = updatedCollaborators;
      this.collaboratorsChange.emit(updatedCollaborators);
      this.newCollaborator = '';
    }
  }

  removeCollaborator(email: string) {
    const updatedCollaborators = this.collaborators.filter(c => c !== email);
    this.collaborators = updatedCollaborators;
    this.collaboratorsChange.emit(updatedCollaborators);
  }
}