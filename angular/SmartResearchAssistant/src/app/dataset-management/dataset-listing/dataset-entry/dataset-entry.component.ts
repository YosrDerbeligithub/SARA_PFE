import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Dataset } from '../../../models/dataset.model';

@Component({
  selector: 'app-dataset-entry',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dataset-entry.component.html',
  styleUrls: ['./dataset-entry.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatasetEntryComponent {
    @Input() dataset!: Dataset;
    @Output() selected = new EventEmitter<string>();
    trackByFn(index: number, dataset: Dataset): string {
    return dataset.id + dataset.visibility; // Include visibility in tracking
  }
    handleClick() {
    this.selected.emit(this.dataset.id.toString());
  }
   getVisibilityLabel(): string {
    switch (this.dataset.visibility) {
      case 'PUBLIC': return 'Public';
      case 'RESTRICTED': return 'Restricted';
      default: return 'Private';
    }
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
}


