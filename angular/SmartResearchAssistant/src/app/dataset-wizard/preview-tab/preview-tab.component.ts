import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataRow, VisibilityType } from '../../models/dataset.model';
import { ValidationError } from '../../services/validation.service';


@Component({
  selector: 'app-preview-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './preview-tab.component.html',
  styleUrls: ['./preview-tab.component.css']
})
export class PreviewTabComponent {
  @Input() parsedData: any[] = [];

  @Input() schemaValid = false;
  @Input() showInvalidSchema = false;
  @Input() visibility: VisibilityType = 'PRIVATE';
  @Input() collaborators: string[] = [];
  @Input() validationErrors: ValidationError[] = [];
  @Input() canCreate = false;  


  
  @Output() prevStep = new EventEmitter<void>();
  @Output() createDataset = new EventEmitter<void>();

  


  get displayedData(): any[] {
    return this.parsedData.slice(0, 10);
  }
  get columns(): string[] {
    return this.parsedData.length > 0 ? Object.keys(this.parsedData[0]) : [];
  }
  chartRendered = false;
  

  
  renderChart() {
    this.chartRendered = true;
  }
}