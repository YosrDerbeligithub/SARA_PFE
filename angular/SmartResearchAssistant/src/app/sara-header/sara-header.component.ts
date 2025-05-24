import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-sara-header",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./sara-header.component.html",
  styleUrls: ["./sara-header.component.css"]
})
export class SaraHeaderComponent {
  userName: string = "Researcher";
  
  logout(): void {
    // Implement logout logic here
    console.log("Logging out...");
    // Typically you would navigate to login page or call an auth service
    // this.authService.logout();
    // this.router.navigate(['/login']);
  }
}