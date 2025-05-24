import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-schema-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './schema-viewer.component.html',
  styleUrls: ['./schema-viewer.component.css']
})
export class SchemaViewerComponent implements OnChanges {
  @Input() schema: any;
  @Input() isEditing = false;
  @Output() schemaUpdate = new EventEmitter<any>();
  
  schemaString = '';
  error: string | null = null;
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['schema']) {
      this.formatSchema();
    }
  }
  
  formatSchema() {
    try {
      this.schemaString = JSON.stringify(this.schema, null, 2);
    } catch (err) {
      console.error('Error formatting schema:', err);
      this.schemaString = '{}';
    }
  }
  
  saveSchema() {
    try {
      const updatedSchema = JSON.parse(this.schemaString);
      this.error = null;
      this.schemaUpdate.emit(updatedSchema);
    } catch (err) {
      this.error = 'Invalid JSON schema. Please check your syntax.';
    }
  }
}