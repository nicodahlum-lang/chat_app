import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    async sendPushNotification(pushToken: string, title: string, body: string, data?: any) {
        if (!pushToken) {
            return;
        }

        const message = {
            to: pushToken,
            sound: 'default',
            title,
            body,
            data: data || {},
        };

        try {
            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            });

            const responseJson = await response.json();
            this.logger.log(`Push notification sent: ${JSON.stringify(responseJson)}`);

            return responseJson;
        } catch (error) {
            this.logger.error('Error sending push notification', error);
            throw error;
        }
    }
}
