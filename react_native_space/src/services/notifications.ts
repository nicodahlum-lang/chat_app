import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export async function registerForPushNotificationsAsync() {
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
            console.log('Failed to get push token for push notification!');
            return;
        }

        try {
            const projectId = 'b406afc2-5c9c-4ab4-b778-9e5c5ae0d3d2'; // We can typically get this from Constants, but for now we'll handle gracefully if it fails.
            token = (await Notifications.getExpoPushTokenAsync({
                projectId: projectId, // Optional: if using EAS Build
            })).data;
            console.log('Expo Push Token:', token);
        } catch (e) {
            console.log('Error getting push token', e);
        }
    } else {
        console.log('Must use physical device for Push Notifications');
    }

    return token;
}
