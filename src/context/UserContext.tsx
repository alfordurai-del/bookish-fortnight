import React, { createContext, useState, useCallback, useEffect, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const UserContext = createContext({
  user: null,
  isLoading: false,
  error: null,
  updateUserBalance: () => {},
  refetchUser: () => Promise.resolve(),
});

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [lastBalance, setLastBalance] = useState(null);
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState(0);
  const [activeRequestIds, setActiveRequestIds] = useState(new Set());

  const fetchUserProfile = useCallback(async (source = "unknown") => {
    const now = Date.now();
    const requestId = uuidv4();
    
    // Skip if fetching or recent fetch (within 5 seconds)
    if (isFetching || (now - lastFetchTimestamp < 5000)) {
      console.log(`UserProvider: Skipping fetch (isFetching: ${isFetching}, time since last fetch: ${now - lastFetchTimestamp}ms, source: ${source}, requestId: ${requestId})`);
      return;
    }

    const storedUserId = localStorage.getItem('userId');
    const storedUserEmail = localStorage.getItem('userEmail');
    console.log(`UserProvider: Attempting to fetch profile (requestId: ${requestId}, source: ${source})`);
    console.log(`UserProvider: storedUserId from localStorage: ${storedUserId}`);
    console.log(`UserProvider: storedUserEmail from localStorage: ${storedUserEmail}`);

    if (!storedUserId) {
      console.log(`UserProvider: No userId found in localStorage, cannot fetch profile (requestId: ${requestId})`);
      setError("No user ID found. Please log in.");
      setIsLoading(false);
      console.log(`UserProvider: Set isLoading to false due to no userId (requestId: ${requestId})`);
      return;
    }

    setIsFetching(true);
    setActiveRequestIds((prev) => new Set(prev).add(requestId));
    setIsLoading(true); // Set loading true before fetch
    console.log(`UserProvider: Set isLoading to true (requestId: ${requestId})`);

    try {
      const response = await fetch(`http://localhost:6061/api/profile/${storedUserId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(`UserProvider: User data response (requestId: ${requestId}):`, response);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const userData = await response.json();
      console.log(`UserProvider: User profile successfully loaded (requestId: ${requestId}):`, userData);

      // Always update user and reset loading, even if balance is unchanged
      setUser(userData);
      setLastBalance(userData.balance);
      setLastFetchTimestamp(now);
      setError(null);
      setIsLoading(false);
      console.log(`UserProvider: Set isLoading to false after successful fetch (requestId: ${requestId})`);
    } catch (err) {
      console.error(`UserProvider: Failed to fetch user profile (requestId: ${requestId}):`, err);
      setError(err.message);
      setIsLoading(false);
      console.log(`UserProvider: Set isLoading to false due to error (requestId: ${requestId})`);
    } finally {
      setIsFetching(false);
      setActiveRequestIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
      console.log(`UserProvider: Fetch completed, isFetching set to false (requestId: ${requestId})`);
    }
  }, [isFetching, lastBalance, lastFetchTimestamp]);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId && !user && !isLoading) {
      console.log(`UserProvider: Triggering initial fetch in useEffect`);
      fetchUserProfile("initial-load");
    }
  }, [fetchUserProfile, user, isLoading]);

  const updateUserBalance = useCallback(async (newBalance) => {
    if (!user || !user.id) {
      console.error("UserProvider: No user or user.id found, cannot update balance.");
      setError("Cannot update balance: No user found.");
      return;
    }

    try {
      const response = await fetch('http://localhost:6061/api/update-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          balance: newBalance,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      console.log("UserProvider: Balance updated successfully, refetching profile...");
      await fetchUserProfile("updateUserBalance");
    } catch (err) {
      console.error("UserProvider: Failed to update balance:", err);
      setError(`Failed to update balance: ${err.message}`);
    }
  }, [user, fetchUserProfile]);

  const refetchUser = useCallback(async (source = "unknown") => {
    console.log(`UserProvider: refetchUser called from: ${source}`);
    await fetchUserProfile(source);
  }, [fetchUserProfile]);

  return (
    <UserContext.Provider value={{ user, isLoading, error, updateUserBalance, refetchUser }}>
      {children}
    </UserContext.Provider>
  );
};