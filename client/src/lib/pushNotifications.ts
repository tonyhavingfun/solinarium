import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export class PushNotificationService {
  static async initialize() {
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications are only available on native platforms');
      return;
    }

    // Request permission to use push notifications
    await PushNotifications.requestPermissions();

    // Register with Apple / Google to receive push via APNS/FCM
    await PushNotifications.register();

    // On success, we should be able to receive notifications
    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token: ' + token.value);
      // Send the token to your server
      this.sendTokenToServer(token.value);
    });

    // Some issue with our setup and push will not work
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    // Show us the notification payload if the app is open on our device
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received: ' + JSON.stringify(notification));
      
      // Show a local notification or handle the push notification
      this.handleNotificationReceived(notification);
    });

    // Method called when tapping on a notification
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed: ' + JSON.stringify(notification));
      
      // Handle notification tap
      this.handleNotificationTap(notification);
    });
  }

  static async sendTokenToServer(token: string) {
    try {
      const response = await fetch('/api/register-push-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      
      if (response.ok) {
        console.log('Token sent to server successfully');
      } else {
        console.error('Failed to send token to server');
      }
    } catch (error) {
      console.error('Error sending token to server:', error);
    }
  }

  static handleNotificationReceived(notification: any) {
    // You can show a toast, update UI, etc.
    console.log('Handling received notification:', notification);
    
    // Example: Show a toast notification
    // You can integrate this with your existing toast system
  }

  static handleNotificationTap(notification: any) {
    // Navigate to relevant screen based on notification data
    console.log('Handling notification tap:', notification);
    
    // Example: Navigate to a specific page based on notification data
    const data = notification.notification.data;
    if (data?.path) {
      // Use your router to navigate
      window.location.href = data.path;
    }
  }

  static async sendNotification(userId: string, title: string, body: string, data?: any) {
    try {
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          title,
          body,
          data
        }),
      });
      
      if (response.ok) {
        console.log('Notification sent successfully');
        return true;
      } else {
        console.error('Failed to send notification');
        return false;
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }
}