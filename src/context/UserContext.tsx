import React, { createContext, useState, useCallback, useEffect, useContext, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Define user type
interface User {
  id: string;
  email: string;
  username: string;
  balance: number;
  kycStatus?: string;
  [key: string]: any;
}

// Define context type
interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoading: boolean;
  error: string | null;
  updateUserBalance: (newBalance: number) => Promise<void>;
  refetchUser: (source?: string) => Promise<void>;
}

// Create context with default values
export const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};

// UserProvider component
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [lastBalance, setLastBalance] = useState<number | null>(null);
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState(0);
  const [activeRequestIds, setActiveRequestIds] = useState<Set<string>>(new Set());

  const fetchUserProfile = useCallback(async (source = "unknown") => {
    const now = Date.now();
    const requestId = uuidv4();

    if (isFetching || (now - lastFetchTimestamp < 5000)) return;

    const storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      setError("No user ID found. Please log in.");
      setIsLoading(false);
      return;
    }

    setIsFetching(true);
    setIsLoading(true);
    setActiveRequestIds(prev => new Set(prev).add(requestId));

    try {
      const response = await fetch(`http://localhost:6061/api/profile/${storedUserId}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const userData: User = await response.json();
      setUser(userData);
      setLastBalance(userData.balance);
      setLastFetchTimestamp(now);
      setError(null);
      setIsLoading(false);

    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    } finally {
      setIsFetching(false);
      setActiveRequestIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  }, [isFetching, lastFetchTimestamp]);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId && !user && !isLoading) {
      fetchUserProfile("initial-load");
    }
  }, [fetchUserProfile, user, isLoading]);

  const updateUserBalance = useCallback(async (newBalance: number) => {
    if (!user?.id) {
      setError("Cannot update balance: No user found.");
      return;
    }

    try {
      const response = await fetch('http://localhost:6061/api/update-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, balance: newBalance }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      await fetchUserProfile("updateUserBalance");
    } catch (err: any) {
      setError(`Failed to update balance: ${err.message}`);
    }
  }, [user, fetchUserProfile]);

  const refetchUser = useCallback(async (source = "unknown") => {
    await fetchUserProfile(source);
  }, [fetchUserProfile]);

  return (
    <UserContext.Provider value={{ user, setUser, isLoading, error, updateUserBalance, refetchUser }}>
      {children}
    </UserContext.Provider>
  );
};
