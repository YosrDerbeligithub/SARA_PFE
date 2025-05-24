import { Component, signal, EventEmitter, Output, Input } from "@angular/core"
import { CommonModule } from "@angular/common"
import { AccordionDirective } from "../directives/accordion.directive"
import { FormsModule } from "@angular/forms"
import { HierarchyService } from '../sara-admin/sara-admin/services/hierarchy.service';
import { ChangeDetectorRef } from '@angular/core';
import { 
  SensorTypeLevel,
  SiteLevel,
  LocationLevel,
  SensorBoxLevel
} from '../sara-admin/sara-admin/models/hierarchy.model';
import { CustomDatasetService } from "../services/custom-dataset.service";
import { DragDropService } from "../services/drag-drop.service";
interface DatasetAttributesResponse {
  datasetId: number;
  name: string;
  attributes: RawAttributeNode[];
}

interface RawAttributeNode {
  name: string;
  path: string;
  children: RawAttributeNode[];
}
interface CustomDataset {
  id: number;
  name: string;
  attributes: AttributeNode[];
  displayColor: string; 
  path: string; 
}
interface AttributeNode {
  name: string;
  path: string;
  children: AttributeNode[];
  isLeaf: boolean;
  displayColor: string;
  datasetId?: number;  
}

@Component({
  selector: "type-based-list",
  standalone: true,
  imports: [CommonModule, AccordionDirective, FormsModule],
  templateUrl: "./type-based-list.component.html",
  styleUrls: ["./type-based-list.component.css"],
  providers:[AccordionDirective]
})
export class TypeBasedListComponent {
  // Input flag to determine if this is the historical interface
  @Input() isHistoricalInterface = false
  @Input() dragDropService!: DragDropService;
  // Search filter
  searchQuery = ""
sensorTypes: SensorTypeLevel[] = [];
  // Custom data mode state
  showCustomDataPanel = false;
  customDatasets: CustomDataset[] = [];
  customNodeOpenStates = new Set<string>();



  // Track open states for custom data accordion
  customDataOpenStates = {
    datasets: signal<Set<number>>(new Set()),
    tables: signal<Set<number>>(new Set()),
  }



  @Output() sensorSelection = new EventEmitter<string[]>()
  @Output() typeSelection = new EventEmitter<string>()
  @Output() customDataModeChanged = new EventEmitter<boolean>()
  @Output() customNodeSelected = new EventEmitter<AttributeNode>(); 
 @Output() sensorsRendered = new EventEmitter<void>();
  openStates = {
    sensorTypes: signal<Set<number>>(new Set()),
    sites: signal<Set<number>>(new Set()),
    locations: signal<Set<number>>(new Set()),
  }
  selectedSensorType = "temperature"
  constructor(
    private hierarchyService: HierarchyService,
    private cdr: ChangeDetectorRef,
    private datasetService: CustomDatasetService
  ) {}
  ngOnInit() {
  this.hierarchyService.getSensorCentricHierarchy().subscribe({
    next: (data: SensorTypeLevel[]) => {
      this.sensorTypes = data;
      this.cdr.detectChanges();
      this.sensorsRendered.emit();
    },
    error: (err) => console.error('Error loading hierarchy:', err)
  });
  this.loadDatasetAttributes();
}
  private loadDatasetAttributes() {
    this.datasetService.getDatasetAttributes().subscribe({
      next: (datasets: DatasetAttributesResponse[]) => {
        this.customDatasets = datasets.map(ds => ({
          id: ds.datasetId,
          name: ds.name,
          attributes: this.transformAttributes(ds.attributes, ds.datasetId),
          displayColor: this.generateColor(ds.name),
          path: `dataset-${ds.datasetId}`
        }));
      },
      error: err => console.error('Error loading datasets:', err)
    });
  }
  private transformAttributes(nodes: RawAttributeNode[], datasetId?: number): AttributeNode[] {
    return (nodes || []).map(node => {
      const children = this.transformAttributes(node.children || [], datasetId);
      const attrNode = {
        ...node,
        isLeaf: children.length === 0,
        displayColor: this.generateColor(node.path),
        children,
        datasetId // <-- propagate datasetId to all children!
      };
      if (!attrNode.datasetId) {
        console.warn('Missing datasetId for node:', attrNode);
      }
      return attrNode;
    });
  }
  private generateColor(path: string): string {
    // Simple hash for consistent color generation
    const hash = path.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0)
      return a & a
    }, 0)
    const hue = Math.abs(hash) % 360
    return `hsl(${hue}, 70%, 40%)`
  }
  toggleCustomNode(node: AttributeNode) {
    if (this.customNodeOpenStates.has(node.path)) {
        this.customNodeOpenStates.delete(node.path);
    } else {
        this.customNodeOpenStates.add(node.path);
    }
    this.customNodeOpenStates = new Set(this.customNodeOpenStates);
  }

  isCustomNodeOpen(node: AttributeNode): boolean {
    return this.customNodeOpenStates.has(node.path);
  }

  getSensorMetadata(
    sensorType: SensorTypeLevel,
    site: SiteLevel,
    location: LocationLevel,
    sensorBox: SensorBoxLevel
  ) {
  return {
    sensorType: sensorType.sensorType,
    unit: sensorType.unit,
    agentSerial: sensorBox.agentSerial,
    site: site.siteName,
    location: location.locationName,
    displayColor: sensorBox.displayColor,
    siteColor: site.displayColor,
    locationColor: location.displayColor,
    sensorTypeColor: sensorType.displayColor
  };
  }

  onSensorSelect(sensorIds: string[]) {
    this.sensorSelection.emit(sensorIds)
    this.typeSelection.emit(this.selectedSensorType)
  }

  handleDragStart(
    event: DragEvent,
    sensorType: SensorTypeLevel,
    site: SiteLevel,
    location: LocationLevel,
    sensorBox: SensorBoxLevel
  )
  
   {
  const metadata = {
    sensorType: sensorType.sensorType,
    agentSerial: sensorBox.agentSerial,
    unit: sensorType.unit,
    location: location.locationName,
    displayColor: sensorBox.displayColor,
    siteColor: site.displayColor,
    locationColor: location.displayColor,
    sensorTypeColor: sensorType.displayColor,
    isSensor: true
  };   
  event.dataTransfer?.setData("application/json", JSON.stringify(metadata));
  event.dataTransfer?.setData("text/plain", sensorBox.agentSerial);

  }

handleCustomNodeDragStart(event: DragEvent, node: any) {
  const dragElement = event.target as HTMLElement;
console.log('Drag started for node:', node);
console.log('Drag element:', dragElement);
console.log('datasetId:', node.datasetId);
  // Always get datasetId from node or parent
let datasetId = node.datasetId;
  if (!datasetId) {
    const dragElement = event.target as HTMLElement;
    const parentDatasetId = dragElement.closest('[data-dataset-id]')?.getAttribute('data-dataset-id');
    if (parentDatasetId) datasetId = Number(parentDatasetId);
  }
  datasetId = Number(datasetId); // Always a number
if (!datasetId && node.path) {
  // Try to find the parent dataset by traversing up your customDatasets
  const parentDataset = this.customDatasets.find(ds =>
    node.path.startsWith(`/${ds.name}`) || node.path.startsWith(ds.path)
  );
  if (parentDataset) datasetId = parentDataset.id;
}
datasetId = Number(datasetId);
  dragElement.setAttribute('data-dataset-id', String(datasetId));
  dragElement.setAttribute('data-path', node.path || node.id);
  dragElement.setAttribute('data-display-color', node.displayColor);
  dragElement.setAttribute('data-column-name', node.name);
  dragElement.setAttribute('data-column-id', node.path || node.id);
  dragElement.setAttribute('data-column-type', node.children && node.children.length > 0 ? (node.datasetId ? 'dataset' : 'group') : 'column');
console.log('datasetId:', datasetId);
  if (!datasetId || isNaN(datasetId)) {
    console.error('Could not determine datasetId for node:', node);
    return;
  }
  const data = {
    isCustomColumn: true,
    name: node.name,
    path: node.path || node.id,
    displayColor: node.displayColor,
    isGroup: node.children && node.children.length > 0,
    datasetId: datasetId, // <-- always a number and always present!
    type: node.datasetId ? 'dataset' : (node.children && node.children.length > 0 ? 'group' : 'column')
  };
  event.dataTransfer?.setData("application/json", JSON.stringify(data));
  dragElement.classList.add('custom-data-item', 'draggable-custom-node');
}
handleLocationDragStart(event: DragEvent, sensorType: any, site: any, location: any) {
  // Set the drag data for the location
  const metadata = {
    sensorType: sensorType.sensorType,
    site: site.siteName,
    location: location.locationName,
    displayColor: location.displayColor,
    isLocation: true
  };
  event.dataTransfer?.setData("application/json", JSON.stringify(metadata));
  event.dataTransfer?.setData("text/plain", location.locationName);

  // DO NOT call event.preventDefault() or event.stopPropagation() here!
}
  toggleSensorType(typeId: number) {
    const updated = new Set(this.openStates.sensorTypes())
    updated.has(typeId) ? updated.delete(typeId) : updated.add(typeId)
    this.openStates.sensorTypes.set(updated)
  }

  toggleSite(siteId: number) {
    const updated = new Set(this.openStates.sites())
    updated.has(siteId) ? updated.delete(siteId) : updated.add(siteId)
    this.openStates.sites.set(updated)
  }

  toggleLocation(locationId: number) {
    const updated = new Set(this.openStates.locations())
    updated.has(locationId) ? updated.delete(locationId) : updated.add(locationId)
    this.openStates.locations.set(updated)
  }

  toggleCustomDataset(datasetId: number) {
    const updated = new Set(this.customDataOpenStates.datasets())
    updated.has(datasetId) ? updated.delete(datasetId) : updated.add(datasetId)
    this.customDataOpenStates.datasets.set(updated)
  }

  toggleCustomTable(tableId: number) {
    const updated = new Set(this.customDataOpenStates.tables())
    updated.has(tableId) ? updated.delete(tableId) : updated.add(tableId)
    this.customDataOpenStates.tables.set(updated)
  }

  isCustomDatasetOpen(datasetId: number): boolean {
    return this.customDataOpenStates.datasets().has(datasetId)
  }

  isCustomTableOpen(tableId: number): boolean {
    return this.customDataOpenStates.tables().has(tableId)
  }

  isSensorTypeOpen(typeId: number): boolean {
    return this.openStates.sensorTypes().has(typeId)
  }

  isSiteOpen(siteId: number): boolean {
    return this.openStates.sites().has(siteId)
  }

  isLocationOpen(locationId: number): boolean {
    return this.openStates.locations().has(locationId)
  }

  toggleCustomDataPanel() {
    this.showCustomDataPanel = !this.showCustomDataPanel
    this.customDataModeChanged.emit(this.showCustomDataPanel)
    if (!this.showCustomDataPanel) {
      this.customNodeSelected.emit(undefined);
      console.log('customDataModeChanged', this.showCustomDataPanel)
    }
  }

  // Filter function for search
  filterItems(query: string): void {
    this.searchQuery = query.toLowerCase()
  }

  // Check if an item matches the search query
  matchesSearch(text: string): boolean {
    if (!this.searchQuery) return true
    return text.toLowerCase().includes(this.searchQuery)
  }
  
  private dragTimeout: any = null;
private dragStarted = false;

onAccordionHeaderMouseDown(event: MouseEvent, node: any) {
  if (event.button !== 0) return; // Only left mouse button
  this.dragStarted = false;
  this.dragTimeout = setTimeout(() => {
    this.dragStarted = true;
    // Prevent the click event from toggling the accordion
    event.preventDefault();
    // Start drag
    const dragEvent = this.createSyntheticDragEvent(event);
    this.handleCustomNodeDragStart(dragEvent, node);
  }, 500); // 200ms hold to start drag
}

onAccordionHeaderMouseUp(event: MouseEvent, node: any) {
  clearTimeout(this.dragTimeout);
  this.dragStarted = false;
}

onAccordionHeaderMouseLeave(event: MouseEvent, node: any) {
  clearTimeout(this.dragTimeout);
  this.dragStarted = false;
}
onAccordionHeaderDragStart(event: DragEvent, node: any) {
  this.dragStarted = true;
  this.handleCustomNodeDragStart(event, node);
}

onAccordionHeaderClick(event: MouseEvent, node: any) {
  if (this.dragStarted) {
    // If drag was started, prevent toggle
    event.preventDefault();
    event.stopPropagation();
    this.dragStarted = false; // Reset for next interaction
    return;
  }
  this.toggleLocation(node.locationId ?? node.id); // Or your toggle logic
}
// Utility to create a synthetic DragEvent from MouseEvent
private createSyntheticDragEvent(mouseEvent: MouseEvent): DragEvent {
  // Create a DataTransfer object
  const dataTransfer = new DataTransfer();
  // Create a synthetic DragEvent
  const dragEvent = new DragEvent('dragstart', {
    bubbles: true,
    cancelable: true,
    clientX: mouseEvent.clientX,
    clientY: mouseEvent.clientY,
    dataTransfer
  });
  // Patch dataTransfer for compatibility
  Object.defineProperty(dragEvent, 'dataTransfer', {
    value: dataTransfer
  });
  return dragEvent;
}
}