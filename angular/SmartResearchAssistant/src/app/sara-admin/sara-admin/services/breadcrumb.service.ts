// src/app/sara-admin/services/breadcrumb.service.ts
import { Injectable } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

interface Breadcrumb {
  label: string;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  private breadcrumbs: Breadcrumb[] = [];
  private routeTitles: { [key: string]: string } = {
    '/admin': 'Admin',
    '/admin/dashboard': 'Dashboard',
    '/admin/sites': 'Sites',
    '/admin/locations': 'Locations',
    '/admin/sensor-boxes': 'Sensor Boxes',
    '/admin/sensor-types': 'Sensor Types',
    '/admin/sensor-assignments': 'Sensor Assignments',
    '/admin/users': 'User Management',
    '/admin/reports': 'Reports',
    '/admin/settings': 'Settings'
  };

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.breadcrumbs = this.createBreadcrumbs(this.activatedRoute.root);
    });
  }

  private createBreadcrumbs(route: ActivatedRoute, url: string = '', breadcrumbs: Breadcrumb[] = []): Breadcrumb[] {
    const children = route.children;

    if (children.length === 0) {
      return breadcrumbs;
    }

    for (const child of children) {
      const routeURL = child.snapshot.url.map(segment => segment.path).join('/');
      if (routeURL !== '') {
        url += `/${routeURL}`;
      }

      // Add breadcrumb if route has data and title
      if (url in this.routeTitles) {
        breadcrumbs.push({
          label: this.routeTitles[url],
          url: url
        });
      }

      return this.createBreadcrumbs(child, url, breadcrumbs);
    }

    return breadcrumbs;
  }

  getBreadcrumbs(): Breadcrumb[] {
    return this.breadcrumbs;
  }

  // Method to manually set breadcrumbs for dynamic routes
  setBreadcrumbs(breadcrumbs: Breadcrumb[]): void {
    this.breadcrumbs = breadcrumbs;
  }
}