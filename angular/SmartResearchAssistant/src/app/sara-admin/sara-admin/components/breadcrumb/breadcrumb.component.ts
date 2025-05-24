// src/app/sara-admin/components/breadcrumb/breadcrumb.component.ts
import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { BreadcrumbService } from '../../services/breadcrumb.service';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

interface Breadcrumb {
  label: string;
  url: string;
}

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.css'],
  standalone:true,
  imports: [RouterModule, CommonModule] // Add RouterModule to imports
})
export class BreadcrumbComponent implements OnInit {
  breadcrumbs: Breadcrumb[] = [];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private breadcrumbService: BreadcrumbService
  ) {}

  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.breadcrumbs = this.breadcrumbService.getBreadcrumbs();
    });
  }
}