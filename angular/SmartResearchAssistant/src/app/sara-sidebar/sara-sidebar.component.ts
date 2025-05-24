import { Component } from '@angular/core';

// Removed duplicate @Component decorator
// Removed duplicate definition of SaraSidebarComponent
import { Inject } from "@angular/core";
import { SidebarService } from "../services/sidebar.service"; // Adjust the path as needed
import { RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { OnInit } from "@angular/core";

@Component({
  selector: "app-sara-sidebar",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./sara-sidebar.component.html",
  styleUrls: ["./sara-sidebar.component.css"]
})
export class SaraSidebarComponent implements OnInit {
  // Set to true to have the sidebar collapsed by default.
  isCollapsed = true;
  isDataAnalysisExpanded = false;
  constructor(@Inject(SidebarService) public sidebarService: SidebarService) {}

  ngOnInit(): void {
    // Apply the collapsed class on load if isCollapsed is true.
    document.body.classList.toggle("sidebar-collapsed", this.sidebarService.isCollapsed());
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    document.body.classList.toggle("sidebar-collapsed", this.sidebarService.isCollapsed());
  }

  toggleDataAnalysis(): void {
    this.isDataAnalysisExpanded = !this.isDataAnalysisExpanded;
  }
}