// src/app/sara-admin/pages/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { TreeNode } from '../../components/hierarchy-tree/hierarchy-tree.component';
import { HierarchyTreeComponent } from '../../components/hierarchy-tree/hierarchy-tree.component';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HierarchyService } from '../../services/hierarchy.service';
import { SiteService } from '../../services/site.service';
import { LocationService } from '../../services/location.service';
import { SensorBoxService } from '../../services/sensor-box.service';
import { SensorTypeService } from '../../services/sensor-type.service';
import { SiteLevelLocationCentric} from '../../models/hierarchy.model';
import { forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';

interface DashboardStat {
  title: string;
  value: string;
  description: string;
  icon: string;
  iconColor: string;
}

interface ActivityItem {
  user: {
    name: string;
    avatar: string;
    initials: string;
  };
  action: string;
  target: string;
 
}
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: true,
  imports: [HierarchyTreeComponent, StatCardComponent, CommonModule],
})
export class DashboardComponent implements OnInit {
  activeTab = 'hierarchy';
  isLoading = true;
  hierarchyData: TreeNode[] = [];
  stats: DashboardStat[] = [
    {
      title: 'Total Sites',
      value: '12',
      description: '+2 from last month',
      icon: 'far fa-map',
      iconColor: '#8b5cf6'
    },
    {
      title: 'Total Locations',
      value: '48',
      description: '+5 from last month',
      icon: 'far fa-building',
      iconColor: '#3b82f6'
    },
    {
      title: 'Sensor Boxes',
      value: '124',
      description: '+12 from last month',
      icon: 'fas fa-microchip',
      iconColor: '#10b981'
    },
    {
      title: 'Sensor Types',
      value: '16',
      description: '+3 from last month',
      icon: 'fas fa-network-wired',
      iconColor: '#ef4444'
    }
  ];

  constructor(
    private hierarchyService: HierarchyService,
    private siteService: SiteService,
    private locationService: LocationService,
    private sensorBoxService: SensorBoxService,
    private sensorTypeService: SensorTypeService
  ) {}

  ngOnInit(): void {
    this.loadHierarchyData();
    // Simulate loading data
    this.isLoading = true;

    forkJoin({
      hierarchy: this.hierarchyService.getLocationCentricHierarchy().pipe(
        catchError(error => {
          console.error('Error loading hierarchy:', error);
          return of([]);
        })
      ),
      sites: this.siteService.countSites().pipe(
        catchError(error => {
          console.error('Error loading sites count:', error);
          return of(0);
        })
      ),
      locations: this.locationService.countLocations().pipe(
        catchError(error => {
          console.error('Error loading locations count:', error);
          return of(0);
        })
      ),
      sensorBoxes: this.sensorBoxService.countSensorBoxes().pipe(
        catchError(error => {
          console.error('Error loading sensor boxes count:', error);
          return of(0);
        })
      ),
      sensorTypes: this.sensorTypeService.getSensorTypes().pipe(
        map(types => types.length),
        catchError(error => {
          console.error('Error loading sensor types:', error);
          return of(0);
        })
      )
    }).subscribe({
      next: ({ hierarchy, sites, locations, sensorBoxes, sensorTypes }) => {
        this.hierarchyData = this.transformHierarchyData(hierarchy);
        this.stats = [
          {
            title: 'Total Sites',
            value: sites.toString(),
            description: '+2 from last month', // Update this with real data if available
            icon: 'far fa-map',
            iconColor: '#8b5cf6'
          },
          {
            title: 'Total Locations',
            value: locations.toString(),
            description: '+5 from last month',
            icon: 'far fa-building',
            iconColor: '#3b82f6'
          },
          {
            title: 'Sensor Boxes',
            value: sensorBoxes.toString(),
            description: '+12 from last month',
            icon: 'fas fa-microchip',
            iconColor: '#10b981'
          },
          {
            title: 'Sensor Types',
            value: sensorTypes.toString(),
            description: '+3 from last month',
            icon: 'fas fa-network-wired',
            iconColor: '#ef4444'
          }
        ];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.isLoading = false;
      }
    });
  }

  private loadHierarchyData(): void {
    this.isLoading = true;
    this.hierarchyService.getLocationCentricHierarchy().subscribe({
      next: (data) => {
        this.hierarchyData = this.transformHierarchyData(data);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading hierarchy:', error);
        this.isLoading = false;
      }
    });
  }
  private transformHierarchyData(data: SiteLevelLocationCentric[]): TreeNode[] {
    return data.map(site => ({
      id: `site-${site.siteId}`,
      name: site.siteName,
      type: 'site',
      expanded: true,
      icon: 'fas fa-globe',
      iconColor: '#8b5cf6',
      children: site.locations.map(location => ({
        id: `loc-${location.locationId}`,
        name: location.locationName,
        type: 'location',
        expanded: true,
        icon: 'fas fa-building',
        iconColor: '#3b82f6',
        children: location.sensorBoxes.map(sensorBox => ({
          id: `sb-${sensorBox.sensorBoxId}`,
          name: sensorBox.agentSerial,
          type: 'sensorBox',
          expanded: false, // Added expanded property
          sensorCount: sensorBox.assignments.length,
          icon: 'fas fa-microchip',
          iconColor: '#10b981'
        }))
      }))
    }));
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  handleNodeToggled(node: TreeNode): void {
    console.log('Node toggled:', node);
  }
}