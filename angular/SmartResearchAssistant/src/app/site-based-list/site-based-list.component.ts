import { Component, Input } from '@angular/core';
import { DragDropService } from '../services/drag-drop.service';
import { AccordionDirective } from '../directives/accordion.directive';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AfterViewInit } from '@angular/core'; // Add this import
import { Renderer2, inject } from '@angular/core';
import { CdkDragDrop, CdkDrag, CdkDropList, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

interface SiteBasedList {
  siteId: number;
  siteName: string;
  displayColor: string;
  locations: {
    locationId: number;
    locationName: string;
    displayColor: string;
    sensorBoxes: {
      sensorBoxId: number;
      agentSerial: string;
      displayColor: string;
      assignments: {
        sensorTypeId: number;
        sensorType: string;
        displayColor: string;
        displayColor_sensortype: string;
      }[];
    }[];
  }[];
}

@Component({
  selector: 'site-based-list',
  templateUrl: './site-based-list.component.html',
  styleUrls: ['./site-based-list.component.css'],
  standalone: true,
  imports: [AccordionDirective, CommonModule,FormsModule,    CdkDrag,
    CdkDropList],
})
export class SiteBasedListComponent {
  siteData = [
    {
      "siteId": 1,
      "siteName": "AIZU University",
      "siteType": "OTHER",
      "displayColor": "#3e7ca3",
      "locations": [
        {
          "locationId": 1,
          "locationName": "M5",
          "displayColor": "#db4660",
          "sensorBoxes": [
            {
              "sensorBoxId": 1,
              "agentSerial": "Multi-Sensor SB-1000",
              "displayColor": "#e35d6a",
              "assignments": [
                {
                  "sensorTypeId": 1,
                  "sensorType": "Temperature",
                  "displayColor": "#dc3545",
                  "displayColor_sensortype": "temperature,sb-1000"
                },
                {
                  "sensorTypeId": 2,
                  "sensorType": "Humidity",
                  "displayColor": "#0d6efd",
                  "displayColor_sensortype": "humidity,sb-1000"
                },
                {
                  "sensorTypeId": 3,
                  "sensorType": "Luminance",
                  "displayColor": "#ffc107",
                  "displayColor_sensortype": "luminance,sb-1000"
                }
              ]
            },
            {
              "sensorBoxId": 2,
              "agentSerial": "Multi-Sensor SB-1001",
              "displayColor": "#ea868f",
              "assignments": [
                {
                  "sensorTypeId": 1,
                  "sensorType": "Temperature",
                  "displayColor": "#dc3545",
                  "displayColor_sensortype": "temperature,sb-1001"
                },
                {
                  "sensorTypeId": 4,
                  "sensorType": "Microphone",
                  "displayColor": "#6f42c1",
                  "displayColor_sensortype": "microphone,sb-1001"
                },
                {
                  "sensorTypeId": 5,
                  "sensorType": "Motion",
                  "displayColor": "#d63384",
                  "displayColor_sensortype": "motion,sb-1001"
                }
              ]
            },
            {
              "sensorBoxId": 3,
              "agentSerial": "Environmental SB-1002",
              "displayColor": "#f1aeb5",
              "assignments": [
                {
                  "sensorTypeId": 2,
                  "sensorType": "Humidity",
                  "displayColor": "#0d6efd",
                  "displayColor_sensortype": "humidity,sb-1002"
                },
                {
                  "sensorTypeId": 6,
                  "sensorType": "Pressure",
                  "displayColor": "#198754",
                  "displayColor_sensortype": "pressure,sb-1002"
                },
                {
                  "sensorTypeId": 7,
                  "sensorType": "Presence",
                  "displayColor": "#0dcaf0",
                  "displayColor_sensortype": "presence,sb-1002"
                }
              ]
            }
          ]
        },
        {
          "locationId": 2,
          "locationName": "Sensor Lab A",
          "displayColor": "#2579fd",
          "sensorBoxes": [
            {
              "sensorBoxId": 4,
              "agentSerial": "Advanced SB-2000",
              "displayColor": "#3d8bfd",
              "assignments": [
                {
                  "sensorTypeId": 3,
                  "sensorType": "Luminance",
                  "displayColor": "#ffc107",
                  "displayColor_sensortype": "luminance,sb-2000"
                },
                {
                  "sensorTypeId": 8,
                  "sensorType": "Thermalamp",
                  "displayColor": "#fd7e14",
                  "displayColor_sensortype": "thermalamp,sb-2000"
                },
                {
                  "sensorTypeId": 10,
                  "sensorType": "Thermography",
                  "displayColor": "#20c997",
                  "displayColor_sensortype": "thermography,sb-2000"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "siteId": 2,
      "siteName": "ISTIC UNIVERSITY",
      "siteType": "CAMPUS",
      "displayColor": "#FFFFFF",
      "locations": [
        {
          "locationId": 12,
          "locationName": "Main Auditorium",
          "displayColor": "#3c91d3",
          "sensorBoxes": [
            {
              "sensorBoxId": 5,
              "agentSerial": "Auditorium SB-3000",
              "displayColor": "#8368da",
              "assignments": [
                {
                  "sensorTypeId": 4,
                  "sensorType": "Microphone",
                  "displayColor": "#6f42c1",
                  "displayColor_sensortype": "microphone,sb-3000"
                },
                {
                  "sensorTypeId": 5,
                  "sensorType": "Motion",
                  "displayColor": "#d63384",
                  "displayColor_sensortype": "motion,sb-3000"
                },
                {
                  "sensorTypeId": 7,
                  "sensorType": "Presence",
                  "displayColor": "#0dcaf0",
                  "displayColor_sensortype": "presence,sb-3000"
                }
              ]
            },
            {
              "sensorBoxId": 6,
              "agentSerial": "Climate SB-3001",
              "displayColor": "#479f76",
              "assignments": [
                {
                  "sensorTypeId": 1,
                  "sensorType": "Temperature",
                  "displayColor": "#dc3545",
                  "displayColor_sensortype": "temperature,sb-3001"
                },
                {
                  "sensorTypeId": 2,
                  "sensorType": "Humidity",
                  "displayColor": "#0d6efd",
                  "displayColor_sensortype": "humidity,sb-3001"
                },
                {
                  "sensorTypeId": 6,
                  "sensorType": "Pressure",
                  "displayColor": "#198754",
                  "displayColor_sensortype": "pressure,sb-3001"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
  sites = this.siteData;
  searchQuery = '';
  private openSites = new Set<number>();
  private openLocations = new Set<number>();
  private openSensorBoxes = new Set<number>();
  private renderer = inject(Renderer2);
  constructor(public dragDropService: DragDropService) {}
  ngAfterViewInit() {

    this.initializeNestedAccordions();
  }
  private initializeNestedAccordions() {
    // Reinitialize sensors when accordions expand
    document.querySelectorAll('.accordion-button').forEach(button => {
      this.renderer.listen(button, 'click', () => {
        setTimeout(() => {
          this.dragDropService.initializeSensors();
        }, 300);
      });
    });
  }
  drop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }
  private initializeDragDrop() {
    setTimeout(() => {
      this.dragDropService.initializeSensors();
      this.dragDropService.initializeDragDrop();
    }, 500);
  }
  private setupAccordionListeners() {
    document.querySelectorAll('.accordion-button').forEach(button => {
      this.renderer.listen(button, 'click', () => {
        setTimeout(() => this.dragDropService.initializeSensors(), 350);
      });
    });
  }
  get filteredData() {
    return this.sites.map(site => ({
      ...site,
      locations: site.locations.filter(location => 
        location.locationName.toLowerCase().includes(this.searchQuery.toLowerCase())
      )
    })).filter(site => site.locations.length > 0);
  }

  toggleAccordion(type: 'site' | 'location' | 'sensorBox', id: number) {
    const collection = type === 'site' ? this.openSites :
                      type === 'location' ? this.openLocations :
                      this.openSensorBoxes;
    
    if (collection.has(id)) {
      collection.delete(id);
    } else {
      collection.add(id);
    }
  }

  isSiteOpen(siteId: number): boolean {
    return this.openSites.has(siteId);
  }

  isLocationOpen(locationId: number): boolean {
    return this.openLocations.has(locationId);
  }

  isSensorBoxOpen(sensorBoxId: number): boolean {
    return this.openSensorBoxes.has(sensorBoxId);
  }
}