import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DatasetListingComponent } from './dataset-listing/dataset-listing.component';
import { DatasetDetailsComponent } from './dataset-details/dataset-details.component';
import { SidebarService } from '../services/sidebar.service';
import { DatasetService } from '../services/dataset.service';
import { AppbarComponent } from '../appbar/appbar.component';
@Component({
  selector: 'app-dataset-management',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DatasetListingComponent,
    DatasetDetailsComponent,
    AppbarComponent
  ],
  templateUrl: './dataset-management.component.html',
  styleUrls: ['./dataset-management.component.css']
})
export class DatasetManagementComponent {
  sidebarService = inject(SidebarService);
  datasetService = inject(DatasetService);
  route = inject(ActivatedRoute);
  router = inject(Router);
  private previousDatasetId: string | null = null; 
  selectedDatasetId: string | null = null;
  
  constructor() {
    // Subscribe to route params to get the selected dataset ID
    this.route.paramMap.subscribe(params => {
      const newId = params.get('id');
      const wasViewingDetails = this.selectedDatasetId !== null;
      this.selectedDatasetId = newId; 
      // Check if we're navigating back to list from details
    if (wasViewingDetails && newId === null) {
      this.datasetService.triggerDatasetRefresh();
    }
    });
  }
  
  
  onSelectDataset(datasetId: string) {
    this.router.navigate(['/datasets', datasetId]);
  }
  
  onBackToList() {
    this.router.navigate(['/datasets']);
  }
}