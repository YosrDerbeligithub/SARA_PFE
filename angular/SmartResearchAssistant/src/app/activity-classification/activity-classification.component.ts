import { Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { SidebarService } from '../services/sidebar.service';
import { Inject } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
@Component({
  selector: 'activity-classification',
  standalone: true,
  imports: [NgClass,SidebarComponent],
  templateUrl: './activity-classification.component.html',
  styleUrls: ['./activity-classification.component.css']
})
export class ActivityClassificationComponent {
  selectedModel: string = 'v2.1';
  sidebarService = inject(SidebarService);

  selectModel(modelVersion: string) {
    this.selectedModel = modelVersion;
  }
}