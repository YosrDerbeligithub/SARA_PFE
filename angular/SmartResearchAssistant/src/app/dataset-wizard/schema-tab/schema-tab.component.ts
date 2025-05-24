import { Component, EventEmitter, Input, Output,OnChanges, SimpleChanges } from '@angular/core';

import { CommonModule } from '@angular/common';
import { ValidationService, ValidationResponse, ValidationError } from '../../services/validation.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-schema-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './schema-tab.component.html',
  styleUrls: ['./schema-tab.component.css']
})
export class SchemaTabComponent implements OnChanges {

  ngOnChanges(changes: SimpleChanges) {
    if (changes['schemaInput']) {
      this.schemaInput = changes['schemaInput'].currentValue || '';
    }
  }
  @Input() validationErrors: ValidationError[] = []; // Receive validation errors from parent

  @Input() schemaInput: string = '';


  @Input() parsedData: any = null;

  @Input() schemaValid = false;
  @Input() showInvalidSchema = false;
  
  @Output() schemaValidChange = new EventEmitter<boolean>();
  @Output() showInvalidSchemaChange = new EventEmitter<boolean>();
  @Output() prevStep = new EventEmitter<void>();
  @Output() nextStep = new EventEmitter<void>();
  @Output() validationErrorsChange = new EventEmitter<ValidationError[]>();
  @Output() schemaInputChange = new EventEmitter<string>();


  
  showExampleSchema = false;


  constructor(private validationService: ValidationService) {}


  
  schemaPlaceholder = `{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "timestamp": { "type": "string", "format": "date-time" },
      "temperature": { "type": "number" },
      "humidity": { "type": "number", "minimum": 0, "maximum": 100 }
    },
    "required": ["timestamp", "temperature"]
  }
}`;

  exampleSchemaCode = `{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "timestamp": { 
        "type": "string", 
        "format": "date-time" 
      },
      "temperature": { 
        "type": "number" 
      },
      "humidity": { 
        "type": "number", 
        "minimum": 0, 
        "maximum": 100 
      }
    },
    "required": ["timestamp", "temperature"]
  }
}`;
  
  toggleExampleSchema() {
    this.showExampleSchema = !this.showExampleSchema;
  }
  
  toggleInvalidSchema() {
    const newValue = !this.showInvalidSchema;
    this.showInvalidSchema = newValue;
    this.showInvalidSchemaChange.emit(newValue);
    
    if (!newValue) {
      this.schemaValid = true;
      this.schemaValidChange.emit(true);
    }
  }
  
  handleSchemaChange(event?: Event) {
    if (event) {
      this.schemaInput = (event.target as HTMLTextAreaElement).value;
    }
    
    if (!this.showInvalidSchema) {
      this.schemaValid = true;
      this.schemaValidChange.emit(true);
    }
    this.schemaInputChange.emit(this.schemaInput); // Add this line

  }
  
  handleNextStep() {
    try {
      const schema = this.schemaInput ? JSON.parse(this.schemaInput) : null;
      console.log('Parsed schema:', schema);
      console.log('Parsed data:', this.parsedData);

        const shapeErrors = this.validateSchemaShape(schema);
      if (shapeErrors.length > 0) {
        this.showSchemaError(shapeErrors.join('; '));
        return;
      }

      this.validationService.validate(this.parsedData, schema).subscribe({
        next: (response) => {
          console.log('Validation response:', response);
          this.schemaValid = response.valid;
          this.showInvalidSchema = !response.valid;
          this.validationErrors = response.errors;
          
          this.schemaValidChange.emit(this.schemaValid);
          this.showInvalidSchemaChange.emit(this.showInvalidSchema);
          this.validationErrorsChange.emit(this.validationErrors);
          
          if (this.schemaValid) {
            this.nextStep.emit();
          }
        },
        error: (error: unknown) => {
          console.error('Validation error:', error);
          this.handleValidationError();
        }
      });
    } catch (e) {
      this.handleValidationError();
    }
  }

  validateSchema() {
    try {
      const schema = this.schemaInput ? JSON.parse(this.schemaInput) : null;
      console.log('Parsed schema:', schema);
      console.log('Parsed data:', this.parsedData);
      const shapeErrors = this.validateSchemaShape(schema);
  if (shapeErrors.length > 0) {
    this.showSchemaError(shapeErrors.join('; '));
    return;
  }

      this.validationService.validate(this.parsedData, schema).subscribe({
        next: (response) => {
          console.log('Validation response:', response);
          this.schemaValid = response.valid;
          this.showInvalidSchema = !response.valid;
          this.validationErrors = response.errors;
  
          // Emit state-related variables for consistency
          this.schemaValidChange.emit(this.schemaValid);
          this.showInvalidSchemaChange.emit(this.showInvalidSchema);
          this.validationErrorsChange.emit(this.validationErrors);
        },
        error: (error: unknown) => {
          console.error('Validation error:', error);
          this.handleValidationError();
        }
      });
    } catch (e) {
      this.handleValidationError();
    }
  }

  private validateSchemaShape(schema: any): string[] {
  const errs: string[] = [];

  // 1) root must be an array
  if (schema.type !== 'array') {
    errs.push(`Schema root must have "type": "array"`);
  }

  // 2) must have items object
  if (!schema.items || typeof schema.items !== 'object') {
    errs.push(`Schema must define an "items" object`);
  } else {
    const items = schema.items;
    // 3) items.type must be object
    if (items.type !== 'object') {
      errs.push(`Schema.items.type must be "object"`);
    }
    // 4) items.properties must exist and be an object
    if (!items.properties || typeof items.properties !== 'object') {
      errs.push(`Schema.items.properties must be an object`);
    }
    // 5) items.required must be an array
    if (!Array.isArray(items.required)) {
      errs.push(`Schema.items.required must be an array`);
    }
    // 6) additionalProperties must be explicitly set
    if (items.additionalProperties === undefined) {
      errs.push(`Schema.items.additionalProperties must be specified (true/false)`);
    }
  }

  return errs;
}

  private showSchemaError(message: string) {
    this.schemaValid = false;
    this.showInvalidSchema = true;
    this.validationErrors = [{
      dataPath: '',
      schemaPath: '',
      message: message
    }];
    this.schemaValidChange.emit(false);
    this.showInvalidSchemaChange.emit(true);
    this.validationErrorsChange.emit(this.validationErrors);
  }


  

  private handleValidationError() {
    this.schemaValid = false;
    this.showInvalidSchema = true;
    this.validationErrors = [{
      dataPath: '',
      schemaPath: '',
      message: 'Invalid JSON schema format'
    }];
    this.schemaValidChange.emit(false);
    this.showInvalidSchemaChange.emit(true);
    this.validationErrorsChange.emit(this.validationErrors);

  }

}