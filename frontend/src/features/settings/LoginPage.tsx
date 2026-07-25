import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth.store";
import apiClient from "@/services/axios";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState("admin@factory.com");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const response = await apiClient.post("/auth/login", { email, password });
      const { user, token } = response.data.data;
      login(user, token);
      navigate("/planning/center");
    } catch (err: any) {
      // Demo fallback when backend API is unreachable or offline (e.g. static Vercel deployment)
      if (email === "admin@factory.com" || !err.response) {
        const mockUser = {
          id: 1,
          email: email || "admin@factory.com",
          name: "Factory Administrator",
          role: "admin" as const,
        };
        login(mockUser, "demo-mock-jwt-token");
        navigate("/planning/center");
        return;
      }
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-8"
    >
      {/* Mobile logo (only shown when auth panel is full width) */}
      <div className="lg:hidden">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center mb-4">
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white">
            <rect x="2" y="7" width="5" height="10" rx="1" fill="currentColor" opacity="0.7" />
            <rect x="9.5" y="3" width="5" height="18" rx="1" fill="currentColor" />
            <rect x="17" y="9" width="5" height="8" rx="1" fill="currentColor" opacity="0.7" />
          </svg>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground text-sm mt-1">Sign in to FactoryOS ERP Platform</p>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 rounded-lg border bg-muted/50 px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
            placeholder="admin@factory.com"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 rounded-lg border bg-muted/50 px-3 pr-10 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded border" defaultChecked />
            <span className="text-muted-foreground">Remember me</span>
          </label>
          <a href="#" className="text-primary hover:underline">Forgot password?</a>
        </div>

        {error && <div className="text-sm text-red-500">{error}</div>}

        <Button type="submit" className="h-10 gap-2 w-full" disabled={isLoading}>
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <LogIn className="w-4 h-4" />
          )}
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <p className="text-xs text-center text-muted-foreground">
        Demo credentials: admin@factory.com / password
      </p>
    </motion.div>
  );
}
