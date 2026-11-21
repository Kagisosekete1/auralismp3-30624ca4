import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import OneSignal from "@onesignal/capacitor-plugin";
import { supabase } from "@/integrations/supabase/client";

const nativeRedirect = "com.semogrouptech.auralis://auth/callback";
const oneSignalAppId = import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string, username?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  setPushEnabled: (enabled: boolean) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [pushReady, setPushReady] = useState(false);
  const permissionPromptStarted = useRef(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !oneSignalAppId) return;
    let disposed = false;
    let removeUrlListener: (() => void) | undefined;

    const finishAuthFromUrl = async (url: string) => {
      const callback = new URL(url);
      const code = callback.searchParams.get("code");
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      } else {
        const accessToken = callback.hash.match(/(?:^|&)access_token=([^&]+)/)?.[1];
        const refreshToken = callback.hash.match(/(?:^|&)refresh_token=([^&]+)/)?.[1];
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: decodeURIComponent(accessToken),
            refresh_token: decodeURIComponent(refreshToken),
          });
        }
      }
      await Browser.close().catch(() => undefined);
    };

    void OneSignal.initialize(oneSignalAppId).then(() => {
      if (!disposed) setPushReady(true);
    }).catch((error) => console.warn("OneSignal initialization failed", error));

    void App.addListener("appUrlOpen", ({ url }) => {
      void finishAuthFromUrl(url).catch((error) => console.error("OAuth callback failed", error));
    }).then((listener) => {
      if (disposed) void listener.remove();
      else removeUrlListener = () => void listener.remove();
    });
    void App.getLaunchUrl().then((launch) => {
      if (launch?.url) return finishAuthFromUrl(launch.url);
    }).catch((error) => console.error("Could not read app launch URL", error));

    return () => {
      disposed = true;
      removeUrlListener?.();
    };
  }, []);

  useEffect(() => {
    if (!pushReady) return;
    const syncOneSignalUser = user
      ? OneSignal.login(user.id)
      : OneSignal.logout();
    void syncOneSignalUser.catch((error) => console.warn("OneSignal user sync failed", error));
  }, [pushReady, user]);

  useEffect(() => {
    if (!pushReady || !user || !Capacitor.isNativePlatform() || permissionPromptStarted.current) return;
    const permissionKey = "auralis_push_permission";
    if (localStorage.getItem(permissionKey)) return;

    permissionPromptStarted.current = true;
    let active = true;
    void OneSignal.Notifications.requestPermission(false).then(async (granted) => {
      if (!active) return;
      localStorage.setItem(permissionKey, granted ? "granted" : "denied");
      if (granted) await OneSignal.User.pushSubscription.optIn();
      else await OneSignal.User.pushSubscription.optOut();
    }).catch((error) => {
      permissionPromptStarted.current = false;
      console.warn("Notification permission request failed", error);
    });

    return () => { active = false; };
  }, [pushReady, user]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string, username?: string) => {
    const redirectUrl = Capacitor.isNativePlatform() ? nativeRedirect : `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName,
          username,
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const isNative = Capacitor.isNativePlatform();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: isNative ? nativeRedirect : `${window.location.origin}/`,
        skipBrowserRedirect: isNative,
      },
    });
    if (error) return { error };
    if (isNative && data.url) {
      try {
        await Browser.open({ url: data.url });
      } catch (openError) {
        return { error: openError instanceof Error ? openError : new Error("Could not open Google sign-in") };
      }
    }
    return { error: null };
  };

  const setPushEnabled = async (enabled: boolean) => {
    if (!Capacitor.isNativePlatform() || !pushReady) return false;
    if (enabled) {
      const granted = await OneSignal.Notifications.requestPermission(false);
      localStorage.setItem("auralis_push_permission", granted ? "granted" : "denied");
      if (granted) await OneSignal.User.pushSubscription.optIn();
      return granted;
    }
    localStorage.setItem("auralis_push_permission", "denied");
    await OneSignal.User.pushSubscription.optOut();
    return false;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signInWithGoogle, signOut, setPushEnabled }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
