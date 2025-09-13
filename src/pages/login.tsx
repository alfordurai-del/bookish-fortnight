// LoginPage.tsx
import { useState, } from "react";
import { navigate } from "wouter/use-browser-location";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useLocation } from "wouter";
import { useUser } from "../context/UserContext";
import { ChevronLeft } from 'lucide-react'; // Import the back icon
import { API_BASE_URL } from "../config"; 

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { setUser } = useUser();
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      console.log("Attempting login with payload:", { email, accessCode });
      const res = await fetch("https://myblog.alwaysdata.net/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, accessCode }),
      });

      console.log("Response received. res.ok:", res.ok, "Status:", res.status);

      if (!res.ok) {
        let errorData = { error: "Login failed" };
        try {
          errorData = await res.json();
          console.error("Backend error response:", errorData);
        } catch (jsonError) {
          console.error("Failed to parse error JSON:", jsonError);
          errorData.error = "Login failed: Could not parse error details.";
        }
        setError(errorData.error || "Login failed");
        setLoading(false);
        return;
      }
      
      const user = await res.json();
      console.log("Successfully parsed user data:", user);
      
      setUser(user); // Save user profile to context/localStorage
      localStorage.setItem("userId", user.id); // Explicitly save userId
      localStorage.setItem("userEmail", user.email); // Explicitly save userEmail if it exists on user object

      setLocation("/");
      setTimeout(() => window.location.reload(), 100); // slight delay to allow navigation
    } catch (err) {
      console.error("Catch block: Network or JSON parsing error:", err);
      setError("Network error: Could not reach server or parse response.");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle back button click
  const handleGoBack = () => {
    window.location.href = "/" // go back one page in history
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 relative"> {/* Added relative for positioning */}
      {/* Back button positioned at the top-left */}
      <Button
        variant="ghost" // Use a ghost variant for a subtle look
        size="icon" // Make it an icon button
        onClick={handleGoBack}
        className="absolute top-4 left-4 w-24 text-gray-400 hover:bg-gray-700 hover:text-white"
        title="Go back"
      >
        <ChevronLeft className="h-6 w-6" /> Back
      </Button>

      <form
        onSubmit={handleLogin}
        className="bg-gray-900 border border-gray-700 rounded-xl p-8 w-full max-w-md shadow-xl"
      >
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Sign In</h2>
        <div className="mb-4">
          <label className="block text-gray-300 mb-2">Email Address</label>
          <Input
            type="email"
            className="crypto-surface border-slate-600 text-white placeholder-slate-400 focus:border-crypto-blue"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-300 mb-2">Access Code</label>
          <Input
            type="password"
            className="crypto-surface border-slate-600 text-white placeholder-slate-400 focus:border-crypto-blue"
            placeholder="Enter your access code"
            value={accessCode}
            onChange={e => setAccessCode(e.target.value)}
            required
          />
        </div>
        {error && <div className="mb-4 text-red-400 text-sm">{error}</div>}
        <Button
          type="submit"
          className="w-full bg-crypto-blue text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>
    </div>
  );
}