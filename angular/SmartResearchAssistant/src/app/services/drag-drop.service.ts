import { Injectable, Renderer2, RendererFactory2, EventEmitter } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';

interface DropZoneState {
  currentSensorType: string | null;
  currentDrop: HTMLElement | null;
  isCustomDataZone?: boolean;
}
// khoudhou bkolou
/**
 * Enhanced service for managing drag-drop operations with improved ghost handling
 * and better state management
 */
@Injectable()
export class DragDropService {
  // Public properties
  public lastDropX = 0;
  public lastDropY = 0;
  public dropComplete = new EventEmitter<{
    dropZoneId: string;
    sensorData: any;
  }>();
  public sensorRemoved = new EventEmitter<string>();
  readonly showMessage = new EventEmitter<string>();
 
  // Private properties
  private droppedMetadata: string | null = null;
  private renderer: Renderer2;
  private draggedSensor: HTMLElement | null = null;
  private ghostElement: HTMLElement | null = null;
  private offsetX = 0;
  private offsetY = 0;
  private currentSensorType: string | null = null;
  private allowMultipleTypes = true;
  private destroyed$ = new Subject<void>();
  private dropZoneStates = new Map<string, DropZoneState>();
  private lastDropZoneIdSubject = new BehaviorSubject<string>('');
  private activeDrag = false; // Track active drag state
  private eventListeners: Array<() => void> = [];

  // Properties for direct access
  public lastDropZoneId = '';
  public dropZones: any;

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  /**
   * Configure drag-drop behavior
   */
  configureDragDrop(options: { allowMultipleTypes: boolean }): void {
    this.allowMultipleTypes = options.allowMultipleTypes;
    this.currentSensorType = null;
  }

  /**
   * Register a drop zone with a unique ID
   */
  public registerDropZone(dropZoneId: string): void {
    if (!this.dropZoneStates.has(dropZoneId)) {
      this.dropZoneStates.set(dropZoneId, {
        currentSensorType: null,
        currentDrop: null
      });
    }
  }

  /**
   * Unregister a drop zone
   */
  public unregisterDropZone(dropZoneId: string): void {
    this.dropZoneStates.delete(dropZoneId);
  }

  /**
   * Clear drop zones
   */
  public clearDropZone(dropZoneId?: string): void {
    if (dropZoneId) {
      // Clear specific zone
      const state = this.dropZoneStates.get(dropZoneId);
      if (state) {
        state.currentSensorType = null;
        const zone = document.querySelector(`[data-dropzone-id="${dropZoneId}"]`);
        if (zone) this.restoreDropInstructions(zone as HTMLElement);
      }
    } else {
      // Clear all zones
      this.dropZoneStates.forEach((state, id) => {
        state.currentSensorType = null;
        const zone = document.querySelector(`[data-dropzone-id="${id}"]`);
        if (zone) this.restoreDropInstructions(zone as HTMLElement);
      });
    }
  }

  /**
   * Initialize all draggable sensors
   */
  public initializeSensors(): void {
    // Remove existing event listeners first
    document.querySelectorAll<HTMLElement>('.sensor-item,.draggable-classroom, .draggable-custom-node').forEach(element => {
      const existingClone = element.cloneNode(true);
      if (element.parentNode) {
        element.parentNode.replaceChild(existingClone, element);
      }
    });
   
    // Add new event listeners
    document.querySelectorAll<HTMLElement>('.sensor-item,.draggable-classroom, .draggable-custom-node').forEach(element => {
      this.renderer.listen(element, 'mousedown', (e) => this.handleMouseDown(e));
      this.renderer.listen(element, 'touchstart', (e) => this.handleTouchStart(e));
    });
  }

  /**
   * Initialize drop zones
   */
  public initializeDropZones(): void {
    // Find all drop zones and set appropriate styles
    document.querySelectorAll<HTMLElement>('.y-axis-drop-area, .x-axis-drop-area').forEach(dropZone => {
      this.renderer.setStyle(dropZone, 'position', 'relative');
     
      // Mark with data attribute for easy identification
      const dropZoneId = dropZone.dataset['dropzoneId'] || `dz-${Math.random().toString(36).substring(2, 9)}`;
      this.renderer.setAttribute(dropZone, 'data-dropzone-id', dropZoneId);
     
      // Register if not already registered
      if (!this.dropZoneStates.has(dropZoneId)) {
        this.registerDropZone(dropZoneId);
      }
     
      // Add/update drop instructions if empty
      if (!dropZone.querySelector('.dropped-sensor')) {
        this.restoreDropInstructions(dropZone);
      }
    });
  }

  /**
   * Initialize the entire drag-drop system
   */
  public initializeDragDrop(): void {
    // Clear existing state
    if (this.ghostElement) {
      this.ghostElement.remove();
      this.ghostElement = null;
    }
   
    this.activeDrag = false;
    this.draggedSensor = null;
   
    // Reinitialize components
    this.initializeSensors();
    this.initializeDropZones();
  }

  /**
   * Handle accordion toggle event
   */
  public handleAccordionToggle(): void {
    this.initializeSensors();
  }

  /**
   * Set the last drop zone ID
   */
  public setLastDropZoneId(id: string): void {
    this.lastDropZoneId = id;
    this.lastDropZoneIdSubject.next(id);
  }
 
  /**
   * Get the dropped metadata
   */
  public getDroppedMetadata(): string | null {
    return this.droppedMetadata;
  }
 
  /**
   * Get the last drop zone ID as an observable
   */
  public getLastDropZoneId() {
    return this.lastDropZoneIdSubject.asObservable();
  }
 
  /**
   * Get the current sensor type
   */
  public getCurrentSensorType(): string | null {
    return this.currentSensorType;
  }
 
  /**
   * Set dragged metadata
   */
  public setDraggedMetadata(metadata: any): void {
    const element = this.draggedSensor;
    if (!element) return;

    // Combine existing and new metadata
    const newMetadata = {
      ...this.prepareMetadata(element),
      ...metadata
    };
   
    this.droppedMetadata = JSON.stringify(newMetadata);
  }

  /**
   * Clean up on destroy
   */
  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
   
    // Clean up any lingering ghost elements
    if (this.ghostElement) {
      this.ghostElement.remove();
    }
   
    // Remove global event listeners
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    document.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    document.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.cleanupEventListeners();
  this.ghostElement?.remove();
  }

  // Private implementation methods
 
  private handleMouseDown(e: MouseEvent): void {
    if (this.activeDrag) return;
    e.preventDefault();
    // ADD .draggable-custom-node to the selector below:
    const draggableElement = (e.target as HTMLElement).closest(
      '.sensor-item, .draggable-classroom, .draggable-custom-node'
    ) as HTMLElement;
    if (!draggableElement) return;
 
    this.draggedSensor = draggableElement;
    const rect = draggableElement.getBoundingClientRect();
    this.offsetX = e.clientX - rect.left;
    this.offsetY = e.clientY - rect.top;
   
    this.activeDrag = true;
    this.createGhostElement(e.clientX, e.clientY);
   
    // Add global event listeners
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }
 
  private handleTouchStart(e: TouchEvent): void {
    if (this.activeDrag) return;
    const touch = e.touches[0];
    if (!touch) return;
    // ADD .draggable-custom-node to the selector below:
    const draggableElement = (e.target as HTMLElement).closest(
      '.sensor-item, .draggable-classroom, .draggable-custom-node'
    ) as HTMLElement;
    if (!draggableElement) return;
   
    this.draggedSensor = draggableElement;
    const rect = draggableElement.getBoundingClientRect();
    this.offsetX = touch.clientX - rect.left;
    this.offsetY = touch.clientY - rect.top;
   
    this.activeDrag = true;
    this.createGhostElement(touch.clientX, touch.clientY);
   
    // Add global event listeners
    document.addEventListener('touchmove', this.handleTouchMove.bind(this));
    document.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  private createGhostElement(x: number, y: number): void {
    if (!this.draggedSensor) return;
   
    // Clean up any existing ghost
    if (this.ghostElement) {
      this.ghostElement.remove();
    }
 
    // Create new ghost
    this.ghostElement = this.draggedSensor.cloneNode(true) as HTMLElement;
    const rect = this.draggedSensor.getBoundingClientRect();
   
    // Apply specialized styling for custom data items
    if (this.draggedSensor.classList.contains('custom-data-item')) {
      this.ghostElement.classList.add('custom-data-ghost');
      this.ghostElement.style.border = `2px dashed ${this.draggedSensor.dataset['displayColor']}`;
    }
   
    // Apply ghost styling
    Object.assign(this.ghostElement.style, {
      position: 'fixed',
      pointerEvents: 'none',
      zIndex: '10000',
      width: `${rect.width}px`,
      left: `${x - this.offsetX}px`,
      top: `${y - this.offsetY}px`,
      opacity: '0.8',
      transition: 'none', // Prevent transition during drag
      transform: 'scale(0.95)',
    });
   
    this.ghostElement.classList.add('ghost-sensor');
    document.body.appendChild(this.ghostElement);
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.ghostElement || !this.activeDrag) return;
   
    e.preventDefault();
   
    // Move ghost element
    this.ghostElement.style.left = `${e.clientX - this.offsetX}px`;
    this.ghostElement.style.top = `${e.clientY - this.offsetY}px`;
   
    // Update drop zone highlighting
    this.updateDropZoneHighlighting(e.clientX, e.clientY);
  }
 
  private handleTouchMove(e: TouchEvent): void {
    if (!this.ghostElement || !this.activeDrag) return;
   
    e.preventDefault();
   
    const touch = e.touches[0];
    if (!touch) return;
   
    // Move ghost element
    this.ghostElement.style.left = `${touch.clientX - this.offsetX}px`;
    this.ghostElement.style.top = `${touch.clientY - this.offsetY}px`;
   
    // Update drop zone highlighting
    this.updateDropZoneHighlighting(touch.clientX, touch.clientY);
  }

  private updateDropZoneHighlighting(x: number, y: number): void {
    // Remove highlighting from all drop zones
    document.querySelectorAll('.y-axis-drop-area, .x-axis-drop-area').forEach(zone => {
      zone.classList.remove('drop-zone-active');
    });
   
    // Add highlighting to current drop zone
    const dropZone = this.getDropZoneElement(x, y);
    if (dropZone) {
      dropZone.classList.add('drop-zone-active');
    }
  }

  private handleMouseUp(e: MouseEvent): void {
    // Clean up event listeners
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
   
    // Store coordinates for drop handling
    const finalX = e.clientX;
    const finalY = e.clientY;
   
    // Process drop
    this.finalizeDrop(finalX, finalY);
  }
 
  private handleTouchEnd(e: TouchEvent): void {
    // Clean up event listeners
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
   
    // Get last touch position
    let finalX = 0, finalY = 0;
    if (this.ghostElement) {
      const rect = this.ghostElement.getBoundingClientRect();
      finalX = rect.left + rect.width / 2;
      finalY = rect.top + rect.height / 2;
    }
   
    // Process drop
    this.finalizeDrop(finalX, finalY);
  }

  private finalizeDrop(x: number, y: number): void {
    // Reset drag state
    this.activeDrag = false;
   
    // Always remove ghost element
    if (this.ghostElement) {
      this.ghostElement.remove();
      this.ghostElement = null;
    }
   
    // Reset drop zone highlighting
    document.querySelectorAll('.y-axis-drop-area, .x-axis-drop-area').forEach(zone => {
      zone.classList.remove('drop-zone-active');
    });
 
    // Only process drop if we're in a valid drop zone
    if (this.isInDropZone(x, y)) {
      this.handleDrop(x, y);
    }
 
    this.draggedSensor = null;
  }
//update handleDrp()
  private handleDrop(mouseX: number, mouseY: number): void {
    const dropZone = this.getDropZoneElement(mouseX, mouseY);
    if (!dropZone || !this.draggedSensor) return;

    // Get metadata about the dragged item
    const isCustomData = this.draggedSensor.classList.contains('custom-data-item');
    const metadata = {
      isCustomColumn: isCustomData,
      isCustomData,
      sensorType: this.draggedSensor.dataset['sensorType'],
      agentSerial: this.draggedSensor.dataset['agentSerial'],
      unit: this.draggedSensor.dataset['unit'],
      location: this.draggedSensor.dataset['location'],
      site: this.draggedSensor.dataset['site'],
      // Custom data specific
      datasetId: this.draggedSensor.dataset['datasetId'] ? Number(this.draggedSensor.dataset['datasetId']) : undefined,
      columnId: this.draggedSensor.dataset['columnId'],
      columnName: this.draggedSensor.dataset['columnName'],
      columnType: this.draggedSensor.dataset['columnType'],
      displayColor: this.draggedSensor.dataset['displayColor']
    };
   
    this.droppedMetadata = JSON.stringify(metadata);
   
   
    // Get or create drop zone state
    const dropZoneId = dropZone.dataset['dropzoneId'] || 'default-zone';
    if (!this.dropZoneStates.has(dropZoneId)) {
      this.registerDropZone(dropZoneId);
    }
       // Update last drop zone
    this.setLastDropZoneId(dropZoneId);
    const state = this.dropZoneStates.get(dropZoneId)!;
    this.showMessage.emit('drop-success');
    // Get sensor info
    const elementType = this.getElementType(this.draggedSensor);
    const sensorType = this.getSensorType(this.draggedSensor);
   
    // Validation
    if (!this.allowMultipleTypes && !this.validateSensorType(sensorType, state)) {
      this.showMessage.emit('invalid-type');
      return;
    }
   
    // Clear existing if single-type mode
    if (!this.allowMultipleTypes) {
      dropZone.querySelectorAll('.dropped-sensor').forEach(el => el.remove());
    }
 
    // Determine drop type
    const existingElements = dropZone.querySelectorAll<HTMLElement>('.dropped-sensor');
    let canMultiDrop = false;

    // Allow multi-drop for sensors and custom-data
    if (elementType === 'sensor' || elementType === 'custom-data') {
      const allSameTypeAndSensor = Array.from(existingElements).every(el =>
        this.getSensorType(el) === sensorType &&
        (this.getElementType(el) === elementType)
      );
      canMultiDrop = existingElements.length === 0 || allSameTypeAndSensor;
    }
 
    // Execute appropriate drop handler
    if (canMultiDrop && this.allowMultipleTypes) {
      this.handleMultiSensorDrop(dropZone, sensorType);
    } else {
      this.handleSingleSensorDrop(dropZone);
    }
   
    // Update state
    state.currentSensorType = sensorType;
   
    // Remove drop instruction if present
    dropZone.querySelector('.drop-instruction')?.remove();
   
    // Emit drop complete event
    this.dropComplete.emit({
      dropZoneId: dropZoneId,
      sensorData: metadata
    });
   

  }

  private handleSingleSensorDrop(dropZone: HTMLElement): void {
    const dropZoneId = dropZone.dataset['dropzoneId'] || 'default-zone';
    const state = this.dropZoneStates.get(dropZoneId)!;
   
    // Clear existing elements
    dropZone.querySelectorAll('.dropped-sensor').forEach(el => el.remove());

    // Create and add new element
    const newElement = this.createSensorElement();
    dropZone.appendChild(newElement);
    state.currentSensorType = this.getSensorType(this.draggedSensor!);

    // Add double-click listener
    this.renderer.listen(newElement, 'dblclick', () => {
      newElement.remove();
      this.checkRemainingSensors(dropZone);
      if (!dropZone.querySelector('.dropped-sensor')) {
        state.currentSensorType = null;
        this.restoreDropInstructions(dropZone);
      }
      const agentSerial = newElement.dataset['agentSerial'];
      if (agentSerial) {
        this.sensorRemoved.emit(agentSerial);
      }
    });
  }

  private handleMultiSensorDrop(dropZone: HTMLElement, sensorType: string | null): void {
    // Only add new element without clearing existing
    const newElement = this.createSensorElement();
    dropZone.appendChild(newElement);
   
    // Remove drop instruction if present
    const instruction = dropZone.querySelector('.drop-instruction');
    if (instruction) instruction.remove();
   
    // Set up double-click listener
  this.renderer.listen(newElement, 'dblclick', () => {
    newElement.remove();
    this.checkRemainingSensors(dropZone);
    const agentSerial = newElement.dataset['agentSerial'];
    if (agentSerial) {
      this.sensorRemoved.emit(agentSerial);
    }
  });
  }

  private createSensorElement(): HTMLElement {
    const original = this.draggedSensor!;
    const newElement = original.cloneNode(true) as HTMLElement;
    const isSensorType = original.classList.contains('draggable-sensor-type');
    const isClassroom = original.classList.contains('draggable-classroom');

    // Add appropriate classes
    newElement.classList.add('dropped-sensor', 'd-flex', 'align-items-center');
    newElement.classList.remove('ghost-sensor', 'accordion-button', 'collapsed');
   
    // Clean up inner structure for specific types
    if (isSensorType || isClassroom) {
      const colorDot = original.querySelector('.color-dot')?.cloneNode(true) as HTMLElement;
      const text = original.textContent?.trim() || '';
     
      newElement.innerHTML = '';
     
      if (colorDot) {
        colorDot.classList.add('me-2');
        newElement.appendChild(colorDot);
      }
     
      const textSpan = document.createElement('span');
      textSpan.className = 'small';
      textSpan.textContent = text;
      newElement.appendChild(textSpan);
    }

    // Apply consistent styling
    Object.assign(newElement.style, {
      opacity: '1',
      position: 'static',
      transform: 'none',
      fontSize: '0.8em',
      padding: '4px 8px',
      margin: '2px 0',
      background: 'none',
      border: 'none',
      width: 'auto'
    });

    // Handle color dot sizing
    const colorDot = newElement.querySelector('.color-dot') as HTMLElement;
    if (colorDot) {
      Object.assign(colorDot.style, {
        width: '8px',
        height: '8px',
        marginRight: '4px',
        flexShrink: '0'
      });
    }

    // Ensure text alignment
    const textSpan = newElement.querySelector('span') as HTMLElement;
    if (textSpan) {
      Object.assign(textSpan.style, {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      });
    }

    // Apply automatic scaling based on size
    this.autoScaleSensor(newElement);
   
    return newElement;
  }

  private autoScaleSensor(element: HTMLElement): void {
    const textElement = element.querySelector('span') as HTMLElement;
    if (!textElement) return;

    const resizeObserver = new ResizeObserver(entries => {
      entries.forEach(entry => {
        const target = entry.target as HTMLElement;
        const textWidth = textElement.scrollWidth;
        const containerWidth = target.offsetWidth;
       
        target.style.fontSize = textWidth > containerWidth * 0.9
          ? '0.7em'
          : '0.8em';
      });
    });

    resizeObserver.observe(element);
  }

  private checkRemainingSensors(dropZone: HTMLElement): void {
    const remaining = dropZone.querySelectorAll('.dropped-sensor');
    if (remaining.length === 0) {
      const dropZoneId = dropZone.dataset['dropzoneId'] || 'default-zone';
      const state = this.dropZoneStates.get(dropZoneId);
      if (state) {
        state.currentSensorType = null;
      }
      this.restoreDropInstructions(dropZone);
    }
  }

  private restoreDropInstructions(dropZone: HTMLElement): void {
    if (!dropZone.querySelector('.drop-instruction')) {
      // Create container
      const instruction = this.renderer.createElement('div');
      this.renderer.addClass(instruction, 'drop-instruction');
     
      // Create inner span
      const span = this.renderer.createElement('span');
      this.renderer.setStyle(span, 'display', 'inline-block');
      this.renderer.setStyle(span, 'text-align', 'center');
     
      // Create text nodes
      const text1 = this.renderer.createText('Drop sensor');
      const breakLine = this.renderer.createElement('br');
      const text2 = this.renderer.createText('here');
     
      // Build structure
      this.renderer.appendChild(span, text1);
      this.renderer.appendChild(span, breakLine);
      this.renderer.appendChild(span, text2);
      this.renderer.appendChild(instruction, span);
      this.renderer.appendChild(dropZone, instruction);
    }
  }

  private getDropZoneElement(x: number, y: number): HTMLElement | null {
    const elements = document.elementsFromPoint(x, y);
    return elements.find(el =>
      el.classList.contains('y-axis-drop-area') ||
      el.classList.contains('x-axis-drop-area')
    ) as HTMLElement || null;
  }

  private isInDropZone(x: number, y: number): boolean {
    return !!this.getDropZoneElement(x, y);
  }

  private getElementType(element: HTMLElement): string {
    if (element.classList.contains('sensor-item')) return 'sensor';
    if (element.classList.contains('draggable-classroom')) return 'classroom';
    if (element.classList.contains('draggable-location')) return 'location';
    if (element.classList.contains('custom-data-item')) return 'custom-data';
    return 'unknown';
  }

  private getSensorType(element: HTMLElement): string | null {
    if (element.classList.contains('sensor-item')) {
      return element.dataset['sensorType'] ?? null;
    }
    if (element.classList.contains('draggable-sensor-type')) {
      return element.dataset['sensorType'] ?? null;
    }
    if (element.classList.contains('draggable-classroom')) {
      return element.dataset['classroom'] ?? null;
    }
    return null;
  }

private validateSensorType(newType: string | null, state: DropZoneState): boolean {
  // Allow any custom data type to be dropped
  if (this.draggedSensor?.classList.contains('custom-data-item') ||
      this.draggedSensor?.classList.contains('draggable-custom-node')) {
    return true;
  }

  // Existing validation logic for sensors
  if (this.allowMultipleTypes) return true;

  const cleanType = newType?.replace('classroom', '')?.toLowerCase() || null;
 
  if (!state.currentSensorType) {
    state.currentSensorType = cleanType;
    return true;
  }

  return state.currentSensorType === cleanType;
}

  private prepareMetadata(element: HTMLElement): any {
  if (element.classList.contains('custom-data-item')) {
    return {
      isCustomColumn: true,
      name: element.dataset['columnName'] || element.textContent?.trim(),
      path: element.dataset['path'],
      displayColor: element.dataset['displayColor'],
      isGroup: element.classList.contains('draggable-custom-node'),
      datasetId: parseInt(element.dataset['datasetId'] || '0', 10) // <-- always a number
    };
  }

    return {
      sensorType: element.dataset['sensorType'],
      agentSerial: element.dataset['agentSerial'],
      site: element.dataset['site'],
      location: element.dataset['location'],
      unit: element.dataset['unit'],
      displayColor: element.dataset['displayColor']
    };
  }
  private cleanupEventListeners() {
  this.eventListeners.forEach(remove => remove());
  this.eventListeners = [];
}
setLastDropZone(id: string) {
  this.lastDropZoneId = id;
}

}