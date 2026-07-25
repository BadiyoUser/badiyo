import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getFirebaseConfig, type FirebaseWebConfig } from "./firebaseConfig.functions";

let cachedConfig: FirebaseWebConfig | null | undefined;
let registered = false;

async function loadConfig() {
  if (cachedConfig !== undefined) return cachedConfig;
  try {
    cachedConfig = await getFirebaseConfig();
  } catch (e) {
    console.error("Failed to load Firebase config:", e);
    cachedConfig = null;
  }
  return cachedConfig;
}

function encodeSwParams(cfg: FirebaseWebConfig) {
  const params = new URLSearchParams({
    apiKey: cfg.apiKey,
    authDomain: cfg.authDomain,
    projectId: cfg.projectId,
    storageBucket: cfg.storageBucket,
    messagingSenderId: cfg.messagingSenderId,
    appId: cfg.appId,
  });
  return params.toString();
}

/** Register FCM for the currently signed-in user. Safe to call multiple times. */
export async function registerPushForCurrentUser() {
  if (typeof window === "undefined") return;
  if (registered) return;

  const { data: userRes } = await supabase.auth.getUser();
  const uid = userRes.user?.id;
  if (!uid) return;

  const { Capacitor } = await import("@capacitor/core");

  // Native (Android/iOS): use Capacitor PushNotifications plugin.
  if (Capacitor.isNativePlatform()) {
    try {
      const { PushNotifications } = await import("@capacitor/push-notifications");
      let perm = await PushNotifications.checkPermissions();
      if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
        perm = await PushNotifications.requestPermissions();
      }
      if (perm.receive !== "granted") return;

      await PushNotifications.addListener("registration", async (t) => {
        const token = t.value;
        if (!token) return;
        await supabase
          .from("fcm_tokens")
          .upsert(
            { user_id: uid, token, updated_at: new Date().toISOString() },
            { onConflict: "token" },
          );
      });

      await PushNotifications.addListener("registrationError", (err) => {
        console.error("Push registration error:", err);
      });

      await PushNotifications.addListener("pushNotificationReceived", (n) => {
        const title = n.title ?? "Notification";
        const body = n.body ?? "";
        toast(title, { description: body });
      });

      await PushNotifications.register();
      registered = true;
    } catch (e) {
      console.error("Native push registration failed:", e);
    }
    return;
  }

  // Web fallback: Firebase Web SDK.
  if (!("serviceWorker" in navigator) || !("Notification" in window)) return;

  const cfg = await loadConfig();
  if (!cfg) return;

  let permission = Notification.permission;
  if (permission === "default") {
    try {
      permission = await Notification.requestPermission();
    } catch {
      return;
    }
  }
  if (permission !== "granted") return;

  try {
    const { initializeApp, getApps } = await import("firebase/app");
    const { getMessaging, getToken, onMessage, isSupported } = await import(
      "firebase/messaging"
    );
    if (!(await isSupported())) return;

    const app =
      getApps()[0] ??
      initializeApp({
        apiKey: cfg.apiKey,
        authDomain: cfg.authDomain,
        projectId: cfg.projectId,
        storageBucket: cfg.storageBucket,
        messagingSenderId: cfg.messagingSenderId,
        appId: cfg.appId,
        measurementId: cfg.measurementId,
      });

    const swReg = await navigator.serviceWorker.register(
      `/firebase-messaging-sw.js?${encodeSwParams(cfg)}`,
    );

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: cfg.vapidKey,
      serviceWorkerRegistration: swReg,
    });
    if (!token) return;

    await supabase
      .from("fcm_tokens")
      .upsert(
        { user_id: uid, token, updated_at: new Date().toISOString() },
        { onConflict: "token" },
      );

    onMessage(messaging, (payload) => {
      const title = payload.notification?.title ?? "Notification";
      const body = payload.notification?.body ?? "";
      toast(title, { description: body });
    });

    registered = true;
  } catch (e) {
    console.error("Push registration failed:", e);
  }
}
