"use client";

import { useEffect, useRef } from "react";
import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";
import { useAuth } from "@/context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function PushNotificationSetup() {
  const { user } = useAuth();
  const setupDone = useRef(false);

  useEffect(() => {
    // Only run on native Android/iOS
    if (!Capacitor.isNativePlatform()) return;
    if (!user || setupDone.current) return;

    setupDone.current = true;

    const setupPush = async () => {
      try {
        const permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt' || permStatus.receive === 'denied') {
          const requestResult = await PushNotifications.requestPermissions();
          if (requestResult.receive !== 'granted') {
            console.warn("User denied push notification permission");
            return;
          }
        }

        // Register with Apple / Google to receive token
        await PushNotifications.register();

        // Listen for registration success
        PushNotifications.addListener('registration', async (token) => {
          console.log('Push registration success, token: ' + token.value);
          // Save token to Firestore
          try {
            await updateDoc(doc(db, "users", user.uid), {
              fcmToken: token.value,
            });
          } catch (e) {
            console.error("Error saving FCM token:", e);
          }
        });

        // Listen for registration error
        PushNotifications.addListener('registrationError', (error: any) => {
          console.error('Error on registration: ' + JSON.stringify(error));
        });

        // Listen for payload
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push received: ' + JSON.stringify(notification));
          // In a real app, you might show a toast or update local state
        });

        // Listen for action performed
        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('Push action performed: ' + JSON.stringify(notification));
        });

      } catch (error) {
        console.error("Error setting up push notifications", error);
      }
    };

    setupPush();

    return () => {
      if (Capacitor.isNativePlatform()) {
        PushNotifications.removeAllListeners();
      }
    };
  }, [user]);

  return null;
}
