import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  requireInteraction?: boolean;
}

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { toast } = useToast();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      toast({
        title: 'Notifications not supported',
        description: 'Your browser does not support notifications',
        variant: 'destructive',
      });
      return false;
    }

    if (permission === 'granted') {
      return true;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result === 'granted') {
      toast({
        title: 'Notifications enabled',
        description: 'You will now receive farming updates',
      });
      return true;
    } else {
      toast({
        title: 'Notifications disabled',
        description: 'Enable notifications in your browser settings to get updates',
        variant: 'destructive',
      });
      return false;
    }
  };

  const sendNotification = (options: NotificationOptions) => {
    if (permission === 'granted' && 'Notification' in window) {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        requireInteraction: options.requireInteraction || false,
        tag: 'agro-guide'
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
    } else {
      // Fallback to toast notification
      toast({
        title: options.title,
        description: options.body,
      });
    }
  };

  const sendWeatherAlert = (weather: any, location: string) => {
    const alertConditions = ['rain', 'storm', 'thunder', 'heavy'];
    const hasAlert = alertConditions.some(condition => 
      weather.condition?.toLowerCase().includes(condition) ||
      weather.description?.toLowerCase().includes(condition)
    );

    if (hasAlert) {
      sendNotification({
        title: `Weather Alert - ${location}`,
        body: `${weather.condition}: ${weather.description}. Plan your farming activities accordingly.`,
        requireInteraction: true
      });
    }
  };

  const sendMarketPriceAlert = (prices: any[], previousPrices: any[] = []) => {
    if (previousPrices.length === 0) return;

    const alerts = [];
    
    for (const price of prices.slice(0, 5)) {
      const prevPrice = previousPrices.find(p => p.crop === price.crop);
      if (prevPrice) {
        const currentPrice = parseFloat(price.price.replace(/[^\d.]/g, ''));
        const previousPrice = parseFloat(prevPrice.price.replace(/[^\d.]/g, ''));
        
        if (Math.abs(currentPrice - previousPrice) > previousPrice * 0.1) {
          const change = currentPrice > previousPrice ? 'increased' : 'decreased';
          const percentage = Math.round(Math.abs((currentPrice - previousPrice) / previousPrice) * 100);
          alerts.push(`${price.crop} ${change} by ${percentage}%`);
        }
      }
    }

    if (alerts.length > 0) {
      sendNotification({
        title: 'Market Price Update',
        body: `Price changes: ${alerts.slice(0, 2).join(', ')}${alerts.length > 2 ? ` and ${alerts.length - 2} more` : ''}`,
        requireInteraction: false
      });
    }
  };

  return {
    permission,
    requestPermission,
    sendNotification,
    sendWeatherAlert,
    sendMarketPriceAlert,
    isSupported: 'Notification' in window
  };
};