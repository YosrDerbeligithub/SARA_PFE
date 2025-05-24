// src/app/sara-admin/services/notification.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  icon: string;
  time: string;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications: Notification[] = [];
  private notificationSubject = new Subject<Notification>();
  notification$ = this.notificationSubject.asObservable();

  constructor() {
    // Initialize with some example notifications
    this.notifications = [
      {
        id: '1',
        message: 'New sensor box added to Building A',
        type: 'success',
        icon: 'fas fa-check-circle',
        time: '2 hours ago',
        read: false
      },
      {
        id: '2',
        message: 'Sensor SB-1001 is offline',
        type: 'warning',
        icon: 'fas fa-exclamation-triangle',
        time: '3 hours ago',
        read: false
      },
      {
        id: '3',
        message: 'System update completed successfully',
        type: 'info',
        icon: 'fas fa-info-circle',
        time: 'Yesterday',
        read: true
      }
    ];
  }

  getAll(): Notification[] {
    return this.notifications;
  }

  getRecent(count: number = 5): Notification[] {
    return this.notifications.slice(0, count);
  }

  getUnread(): Notification[] {
    return this.notifications.filter(n => !n.read);
  }

  hasUnread(): boolean {
    return this.notifications.some(n => !n.read);
  }

  markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
  }

  add(notification: Omit<Notification, 'id' | 'time' | 'read'>): void {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      time: 'Just now',
      read: false
    };
    
    this.notifications.unshift(newNotification);
    this.notificationSubject.next(newNotification);
  }

  remove(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  clear(): void {
    this.notifications = [];
  }
}