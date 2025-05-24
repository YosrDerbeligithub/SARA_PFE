import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { DatasetEntryComponent } from './dataset-entry/dataset-entry.component';
import { DatasetService } from '../../services/dataset.service';
import { Dataset } from '../../models/dataset.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dataset-listing',
  standalone: true,
  imports: [
    CommonModule,
    DatasetEntryComponent,
    FormsModule,
    RouterModule
  ],
  templateUrl: './dataset-listing.component.html',
  styleUrls: ['./dataset-listing.component.css']
})
export class DatasetListingComponent implements OnInit {
  @Output() selectDataset = new EventEmitter<string>();
  private refreshSubscription!: Subscription;
  datasets: Dataset[] = [];
  filteredDatasets: Dataset[] = [];
  searchQuery = '';
  isLoading = false;
  error: string | null = null;

  constructor(private datasetService: DatasetService) {}

  ngOnInit() {
    this.loadDatasets();
    this.setupRefreshListener();
  }
  loadDatasets() {
    this.isLoading = true;
    this.datasetService.getDatasets().subscribe({
      next: (data) => {
        this.datasets = [...data];
        if (this.searchQuery) {
        this.onSearch();
      } else {
        this.filteredDatasets = [...data];
      }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.isLoading = false;
      }
    });
  }
  ngOnDestroy() {
    this.refreshSubscription?.unsubscribe();
  }
    private setupRefreshListener() {
    this.refreshSubscription = this.datasetService.refreshDatasets$.subscribe({
      next: () => this.loadDatasets()
    });
  }
  onSearch() {
    const query = this.searchQuery.toLowerCase();
    this.filteredDatasets = this.datasets.filter(d => 
      d.name.toLowerCase().includes(query) || 
      (d.description && d.description.toLowerCase().includes(query))
    );
  }

  onSearchKeyUp(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.onSearch();
    }
  }

  clearSearch() {
    this.searchQuery = '';
    this.filteredDatasets = [...this.datasets];
  }

  onSelectDataset(datasetId: string) {
    this.selectDataset.emit(datasetId);
  }
}