import { useState } from "react";
import { Input } from "@/components/ui/input"; // Keep this import
import { Button } from "@/components/ui/button"; // Keep this import
import { useLocation } from "wouter";
export default function AdminLoginPage() {
  const [, setLocation] = useLocation();
  // const { setUser } = useUser(); // Uncomment if using useUser context
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const ADMIN_EMAIL = 'calvingleichner181@gmail.com'; // The designated admin email

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      console.log("Attempting login with payload:", { email, accessCode });
      const res = await fetch("http://localhost:6061/api/auth", {
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

      // Save user profile to context/localStorage
      // If you have a useUser context, you'd do:
      // setUser(user);
      localStorage.setItem("userId", user.id);
      localStorage.setItem("userEmail", user.email);

      // --- Admin Logic Integration ---
      if (user.email === ADMIN_EMAIL) {
        console.log("Admin user logged in. Redirecting to admin dashboard.");
        localStorage.setItem("isAdmin", "true"); // Set admin flag
        setLocation("/admin-dashboard"); // Redirect to admin dashboard route
      } else {
        console.log("Regular user logged in. Redirecting to user dashboard.");
        localStorage.setItem("isAdmin", "false"); // Explicitly set false for non-admins
        setLocation("/"); // Redirect to regular user dashboard
      }

    } catch (err) {
      console.error("Catch block: Network or JSON parsing error:", err);
      setError("Network error: Could not reach server or parse response.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <form
        onSubmit={handleLogin}
        className="bg-gray-900 border border-gray-700 rounded-xl p-8 w-full max-w-md shadow-xl"
      >
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Sign In</h2>
        <div className="mb-4">
          <label className="block text-gray-300 mb-2">Email Address</label>
          <Input
            type="email"
            className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 rounded-md p-3"
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
            className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 rounded-md p-3"
            placeholder="Enter your access code"
            value={accessCode}
            onChange={e => setAccessCode(e.target.value)}
            required
          />
        </div>
        {error && <div className="mb-4 text-red-400 text-sm">{error}</div>}
        <Button
          type="submit"
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition duration-300"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>
    </div>
  );
}
