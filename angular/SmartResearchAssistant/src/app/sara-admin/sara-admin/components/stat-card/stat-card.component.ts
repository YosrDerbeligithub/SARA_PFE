// src/app/sara-admin/components/stat-card/stat-card.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  templateUrl: './stat-card.component.html',
  styleUrls: ['./stat-card.component.css'],
  standalone:true
})
export class StatCardComponent {
  @Input() title: string = '';
  @Input() value: string = '';
  @Input() description: string = '';
  @Input() icon: string = '';
  @Input() iconColor: string = '';
}