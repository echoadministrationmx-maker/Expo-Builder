import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { supabase } from '@/lib/supabase';

type ResidentContextValue = {
  isLoading: boolean;
  isSignedIn: boolean;
  residentName: string;
  signIn: (clave: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const ResidentContext = createContext<ResidentContextValue | null>(null);
const SIGN_IN_ERROR = 'Clave o contraseña incorrectas. Verifica tus datos e intenta de nuevo.';

export function ResidentProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [residentName, setResidentName] = useState('Residente');

  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!mounted) return;
      if (session) {
        setIsSignedIn(true);
        setResidentName((session.user.user_metadata?.display_name as string) ?? 'Residente');
      }
      setIsLoading(false);
    };
    void restoreSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(!!session);
      if (session) {
        setResidentName((session.user.user_metadata?.display_name as string) ?? 'Residente');
      } else {
        setResidentName('Residente');
      }
    });

    const syncAutoRefresh = (state: string) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    };
    syncAutoRefresh(AppState.currentState);
    const appStateSubscription = AppState.addEventListener('change', syncAutoRefresh);

    return () => {
      mounted = false;
      appStateSubscription.remove();
      supabase.auth.stopAutoRefresh();
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (clave: string, password: string) => {
    const claveNormalizada = clave.trim();
    if (!claveNormalizada || !password) {
      throw new Error('Ingresa tu clave y tu contraseña.');
    }

    const { data: correoResuelto, error: errorResolver } = await supabase.rpc('resolver_identidad', {
      p_clave: claveNormalizada,
    });

    if (errorResolver) {
      throw new Error('No pudimos conectar con el servicio. Intenta nuevamente.');
    }

    if (!correoResuelto) {
      throw new Error(SIGN_IN_ERROR);
    }

    const { data: authData, error: errorAuth } = await supabase.auth.signInWithPassword({
      email: correoResuelto as string,
      password: password,
    });

    if (errorAuth) {
      throw new Error(SIGN_IN_ERROR);
    }

    if (!authData.session) {
      throw new Error('No se pudo crear la sesión.');
    }

    // Session is persisted automatically by Supabase (persistSession: true)
    setIsSignedIn(true);
    setResidentName((authData.session.user.user_metadata?.display_name as string) ?? 'Residente');
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      await supabase.auth.signOut({ scope: 'local' });
    }
    setIsSignedIn(false);
    setResidentName('Residente');
  }, []);

  const value = useMemo(
    () => ({
      isLoading,
      isSignedIn,
      residentName,
      signIn,
      signOut,
    }),
    [isLoading, isSignedIn, residentName, signIn, signOut],
  );

  return <ResidentContext.Provider value={value}>{children}</ResidentContext.Provider>;
}

export function useResident() {
  const context = useContext(ResidentContext);
  if (!context) {
    throw new Error('useResident must be used inside ResidentProvider');
  }
  return context;
}
