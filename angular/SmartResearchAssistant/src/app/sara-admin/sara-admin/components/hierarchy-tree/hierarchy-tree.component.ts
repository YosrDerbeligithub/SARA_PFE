// src/app/sara-admin/components/hierarchy-tree/hierarchy-tree.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TreeNode {
  id: string;
  name: string;
  type: 'site' | 'location' | 'sensorBox';
  expanded: boolean;
  icon: string;
  iconColor: string;
  sensorCount?: number;
  children?: TreeNode[];
  // Add backend IDs if needed
  originalId?: number;
  parentId?: number;
}

@Component({
  selector: 'app-hierarchy-tree',
  templateUrl: './hierarchy-tree.component.html',
  styleUrls: ['./hierarchy-tree.component.css'],
  standalone:true,
  imports: [CommonModule],
})
export class HierarchyTreeComponent {
  @Input() nodes: TreeNode[] = [];
  @Input() selectable = false;
  @Input() selectedId: string | null = null;
  @Output() nodeSelected = new EventEmitter<TreeNode>();
  @Output() nodeToggled = new EventEmitter<TreeNode>();

  toggleNode(node: TreeNode, event: Event): void {
    event.stopPropagation();
    node.expanded = !node.expanded;
    this.nodeToggled.emit(node);
  }

  selectNode(node: TreeNode): void {
    if (this.selectable) {
      this.nodeSelected.emit(node);
    }
  }

  getNodeIcon(type: string): string {
    switch (type) {
      case 'site':
        return 'fas fa-building';
      case 'location':
        return 'fas fa-home';
      case 'sensorBox':
        return 'fas fa-microchip';
      default:
        return 'fas fa-circle';
    }
  }

  getIconColor(type: string): string {
    switch (type) {
      case 'site':
        return '#8b5cf6'; // Purple
      case 'location':
        return '#3b82f6'; // Blue
      case 'sensorBox':
        return '#10b981'; // Green
      default:
        return '#6b7280'; // Grey
    }
  }
}