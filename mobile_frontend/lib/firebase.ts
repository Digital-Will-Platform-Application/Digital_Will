// Firebase configuration and push notification setup for mobile app
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request permissions for push notifications
export async function registerForPushNotificationsAsync(userEmail: string) {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return null;
    }
    
    try {
      const projectId = 'digital-will-dc53f'; // From Firebase config
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log('📱 Expo Push Token:', token);
      
      // Register token with backend
      if (token && userEmail) {
        try {
          await registerPushTokenWithBackend(userEmail, token);
        } catch (error) {
          console.error('Error registering push token with backend:', error);
        }
      }
    } catch (error) {
      console.error('Error getting push token:', error);
      token = null;
    }
  } else {
    console.warn('Must use physical device for Push Notifications');
  }

  return token;
}

// Register push token with backend
export async function registerPushTokenWithBackend(userEmail: string, token: string) {
  try {
    const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/push-notifications/register-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_email: userEmail,
        fcm_token: token,
        platform: Platform.OS,
      }),
    });

    const result = await response.json();
    if (result.success) {
      console.log('✅ Push token registered with backend');
    } else {
      console.error('Failed to register push token:', result.message);
    }
  } catch (error) {
    console.error('Error registering push token:', error);
  }
}
