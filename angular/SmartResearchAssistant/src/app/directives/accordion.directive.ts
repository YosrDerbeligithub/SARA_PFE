import {
    Directive,
    ElementRef,
    OnInit,
    OnDestroy,
    effect,
    input
  } from '@angular/core';
  import { Collapse } from 'bootstrap';
 
  @Directive({
    selector: '[appAccordion]',
    standalone: true
  })
  export class AccordionDirective implements OnInit, OnDestroy {
    private transitionDuration = 300; // Match CSS transition time
    private animationFrameId: number | null = null;
    isOpenState = input(false);
    private collapseInstance!: Collapse;
 
    constructor(private el: ElementRef) {
      effect(() => {
        this.isOpenState() ? this.show() : this.hide();
      });
    }
 
    ngOnInit() {
      this.collapseInstance = new Collapse(this.el.nativeElement, {
        parent: this.findParentAccordion(),
        toggle: false,
      });
     
      this.isOpenState() ? this.collapseInstance.show() : this.collapseInstance.hide();
    }
 
    ngOnDestroy() {
      this.collapseInstance.dispose();
    }
 
    private show() {
        if (!this.el.nativeElement.classList.contains('show')) {
            this.collapseInstance.show();
        }
    }
 
    private hide() {
        if (this.el.nativeElement.classList.contains('show')) {
            this.collapseInstance.hide();
        }
    }
 
    private findParentAccordion(): string | Element | undefined {
      return undefined;
    }
  }