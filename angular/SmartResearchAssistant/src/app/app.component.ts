import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppbarComponent } from './appbar/appbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,AppbarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']    // <-- was styleUrl
})
export class AppComponent {
  title = 'SmartResearchAssistant';
}