import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  addApplicationStatusNotification(applicationId: number, jobTitle: string, newStatus: string): void {
    // Stub: Implement notification logic if needed
    console.log(`Notification: Application ${applicationId} for job '${jobTitle}' updated to status '${newStatus}'.`);
  }
}
