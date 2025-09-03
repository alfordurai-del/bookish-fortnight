import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { UserProfile } from "@shared/schema"; // Assuming this path is correct

interface UserContextType {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  updateUserBalance: (newBalance: number) => void; // This will update the USD balance
  refetchUser: () => void;
  setUser: (user: UserProfile | null) => void; // Added for explicit setting if needed
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// IMPORTANT: Ensure VITE_APP_API_BASE_URL is set in your .env file (e.g., .env.local, .env.development)
// Example: VITE_APP_API_BASE_URL=http://localhost:3000
const API_BASE_URL = 'https://myblog.alwaysdata.net'; // Use import.meta.env for Vite

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Initial loading state set to true
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = useCallback(async () => {
    setIsLoading(true); // Start loading
    setError(null);    // Clear previous errors

    try {
      const storedUserId = localStorage.getItem("userId");
      const storedUserEmail = localStorage.getItem("userEmail"); // Logged for debugging

      console.log("UserProvider: Attempting to fetch profile...");
      console.log("UserProvider: storedUserId from localStorage:", storedUserId);
      console.log("UserProvider: storedUserEmail from localStorage (for reference):", storedUserEmail);


      if (!storedUserId) {
        console.log("UserProvider: No userId found in localStorage. User is not logged in or session expired.");
        setUser(null); // Explicitly set user to null
        setIsLoading(false); // Finished loading (no user to load)
        return; // Exit early
      }

      // If userId exists, proceed to fetch
      const response = await fetch(`${API_BASE_URL}/api/profile/${storedUserId}`);

      if (!response.ok) {
        // If the backend returns 404 (user not found) or other error
        if (response.status === 404) {
          console.warn(`UserProvider: User profile for ID ${storedUserId} not found on backend. Clearing local storage.`);
          localStorage.removeItem("userId");
          localStorage.removeItem("userEmail"); // Also clear email if user ID is invalid
        }
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || response.statusText}`);
      }

      // The backend response for /api/profile/:userId should now include 'kycStatus' and 'uid' etc.
      // Use 'any' type temporarily if 'UserProfile' from @shared/schema doesn't yet match
      // the full response. It's better to update UserProfile in @shared/schema.
      const data: any = await response.json(); // <-- Using 'any' here for flexibility; strongly recommend updating UserProfile type

      // Construct the user object, ensuring all expected fields including kycStatus, uid, etc., are present
      const userFromApi: UserProfile = {
        id: data.id,
        // --- FIX: Map 'username' from backend to 'name' or 'username' on frontend ---
        // If UserProfile has 'name', use data.username, if UserProfile has 'username', use data.username directly.
        // Assuming UserProfile has 'username' (based on your console output showing `username: "MUHOZA GYSSAGARA PRINCE"` from backend)
        name: data.username, // Assuming UserProfile type expects 'username'
        email: data.email,
        balance: data.balance !== undefined ? data.balance : 0, // Ensure balance is a number
        kycStatus: data.kycStatus, // THIS IS THE CRUCIAL ADDITION
        // --- FIX: Add missing fields from the backend response ---
        country: data.country,
        documentType: data.documentType,
        accessCode: data.accessCode,
        uid: data.uid,
      };

      setUser(userFromApi);
      console.log("UserProvider: User profile successfully loaded:", userFromApi);
      console.log('User data111: ',response); // This logs the raw Response object, not its JSON content
    } catch (err: any) {
      console.error("UserProvider: Failed to fetch user profile:", err);
      setError("Failed to load user profile: " + err.message);
      setUser(null); // Clear user state on error
    } finally {
      setIsLoading(false); // Always set isLoading to false at the end
    }
  }, [API_BASE_URL]); // Dependency on API_BASE_URL to avoid lint warnings, though it's constant

  useEffect(() => {
    // This effect runs once on mount to fetch the user profile
    fetchUserProfile();
  }, [fetchUserProfile]); // fetchUserProfile is a stable callback, so this won't cause infinite loops

  // This function is for optimistic UI updates or when the balance is updated locally
  const updateUserBalance = useCallback((newBalance: number) => {
    setUser((prevUser) =>
      prevUser ? { ...prevUser, balance: newBalance } : prevUser
    );
  }, []);

  // This function forces a re-fetch of the user data from the backend
  const refetchUser = useCallback(() => {
    fetchUserProfile();
  }, [fetchUserProfile]); // Dependency on fetchUserProfile

  return (
    <UserContext.Provider value={{ user, isLoading, error, updateUserBalance, refetchUser, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};