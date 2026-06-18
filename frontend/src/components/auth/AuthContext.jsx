import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../../lib/API.js";

// Create a context to store authentication data
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Store the current logged in user
  const [user, setUser] = useState(null);

  // Keep track of whether authentication is still loading
  const [loading, setLoading] = useState(true);

  // Runs when the component first loads
  // Checks if a user is already logged in
  useEffect(() => {
    checkAuth();
  }, []);

  // Gets the current user from the backend
  const checkAuth = async () => {
    try {
      const data = await authAPI.getCurrentUser();
      // Save user data if authentication is successful
      setUser(data.user);
    } catch (error) {
      // If authentication fails, clear the user
      setUser(null);
    } finally {
      // Stop the loading state whether it succeeds or fails
      setLoading(false);
    }
  };

  // Handles user login
  const login = async (username, password) => {
    const data = await authAPI.login(username, password);

    // Store logged-in user information
    setUser(data.user);

    return data;
  };

  // Handles user logout
  const logout = async () => {
    await authAPI.logout();

    // Remove user data after logging out
    setUser(null);
  };

  // Values that will be shared with all components
  // that use the authentication context
  const value = {
    user,
    loading,
    login,
    logout,

    // Converts user into a true/false value
    isAuthenticated: !!user,
  };

  // Makes authentication data available to child components
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to access authentication data easily
export function useAuth() {
  const context = useContext(AuthContext);

  // Prevents the hook from being used outside the provider
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

export default AuthContext;
