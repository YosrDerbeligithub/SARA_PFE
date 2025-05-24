import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-data-preview-table',
  templateUrl: './data-preview-table.component.html'
})
export class DataPreviewTableComponent {
  @Input() data: any[] = [];

  get columns(): string[] {
    return ['key', 'value'];
  }

  getColumnValue(row: any, column: string): string {
    return row[column];
  }

  isTimestamp(column: string, value: string): boolean {
    return (
      column.toLowerCase().includes('time') || 
      column.toLowerCase().includes('date') ||
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
    );
  }
  
  isNumber(value: string): boolean {
    return !isNaN(Number(value));
  }
}