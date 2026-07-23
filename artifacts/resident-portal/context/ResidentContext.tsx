import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type MaintenanceRequest = {
  id: string;
  title: string;
  detail: string;
  status: 'Open' | 'In progress' | 'Resolved';
  createdAt: string;
};

export type Announcement = {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  body: string;
  date: string;
  readTime: string;
};

type ResidentContextValue = {
  isLoading: boolean;
  isSignedIn: boolean;
  residentName: string;
  requests: MaintenanceRequest[];
  announcements: Announcement[];
  signIn: (email: string, accessCode: string) => Promise<void>;
  signOut: () => Promise<void>;
  addRequest: (title: string, detail: string) => Promise<void>;
};

const SESSION_KEY = '@resident-portal/session';
const REQUESTS_KEY = '@resident-portal/requests';

const seedRequests: MaintenanceRequest[] = [
  {
    id: 'request-1',
    title: 'Kitchen faucet is dripping',
    detail: 'The faucet has been slowly dripping since yesterday.',
    status: 'In progress',
    createdAt: 'Jun 18, 2026',
  },
];

const announcements: Announcement[] = [
  {
    id: 'announcement-1',
    category: 'Building update',
    title: 'Lobby refresh begins Monday',
    excerpt: 'The east lobby will be refreshed over the next two weeks.',
    body: 'Starting Monday, the east lobby will receive new lighting, seating, and refreshed planting. The main entrance will stay open throughout the project, with a temporary path marked near the concierge desk.',
    date: 'Jun 20, 2026',
    readTime: '2 min read',
  },
  {
    id: 'announcement-2',
    category: 'Community',
    title: 'Summer rooftop hours',
    excerpt: 'The rooftop is now open until 10 PM on Fridays and Saturdays.',
    body: 'Enjoy longer summer evenings upstairs. Please remember that glass containers are not permitted and quiet hours begin at 9 PM.',
    date: 'Jun 14, 2026',
    readTime: '1 min read',
  },
  {
    id: 'announcement-3',
    category: 'Reminder',
    title: 'Package room maintenance',
    excerpt: 'The package room will be briefly unavailable tomorrow morning.',
    body: 'The package room will be closed from 9–11 AM tomorrow while the access reader is serviced. Deliveries will be held securely at the concierge desk during this window.',
    date: 'Jun 08, 2026',
    readTime: '1 min read',
  },
];

const ResidentContext = createContext<ResidentContextValue | null>(null);

export function ResidentProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [residentName, setResidentName] = useState('Alex Morgan');
  const [requests, setRequests] = useState<MaintenanceRequest[]>(seedRequests);

  useEffect(() => {
    const restore = async () => {
      const [session, savedRequests] = await Promise.all([
        AsyncStorage.getItem(SESSION_KEY),
        AsyncStorage.getItem(REQUESTS_KEY),
      ]);
      if (session) {
        setIsSignedIn(true);
        setResidentName(session);
      }
      if (savedRequests) {
        setRequests(JSON.parse(savedRequests) as MaintenanceRequest[]);
      }
      setIsLoading(false);
    };
    void restore();
  }, []);

  const signIn = async (email: string) => {
    const name = email
      .split('@')[0]
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
      .trim() || 'Alex Morgan';
    await AsyncStorage.setItem(SESSION_KEY, name);
    setResidentName(name);
    setIsSignedIn(true);
  };

  const signOut = async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setIsSignedIn(false);
  };

  const addRequest = async (title: string, detail: string) => {
    const nextRequest: MaintenanceRequest = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      detail,
      status: 'Open',
      createdAt: 'Just now',
    };
    const nextRequests = [nextRequest, ...requests];
    setRequests(nextRequests);
    await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(nextRequests));
  };

  const value = useMemo(
    () => ({
      isLoading,
      isSignedIn,
      residentName,
      requests,
      announcements,
      signIn,
      signOut,
      addRequest,
    }),
    [isLoading, isSignedIn, residentName, requests],
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