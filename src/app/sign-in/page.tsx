"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MagicCard } from "@/components/ui/magic-card";
import { Button } from "@/components/ui/button";
import { LogIn01, ArrowLeft, Eye, EyeOff, Zap, CheckCircle, AlertCircle } from "@untitled-ui/icons-react";

function SignInPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include', // ensure server-set httpOnly cookie is stored
        body: JSON.stringify({ username: username.trim(), password })
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        setError(result.error || "Login failed");
        return;
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem("user", JSON.stringify(result.user));
        if (result.token) {
          localStorage.setItem("auth-token", result.token);
        }
      }
      const redirectTo = searchParams?.get("from") || "/dashboard";
      router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const registrationSuccess = searchParams?.get("registered") === "true";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 text-foreground overflow-x-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative flex items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h1 className="font-bold text-xl bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  BIZ ARENA
                </h1>
                <p className="text-xs text-muted-foreground -mt-1">Virtual Startup Challenge</p>
              </div>
            </Link>
            <h2 className="text-3xl font-black mb-2 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
              Welcome Back
            </h2>
            <p className="text-muted-foreground">Sign in to access your competition dashboard</p>
          </div>

          {/* Main Form Card */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-accent/50 rounded-2xl blur opacity-25 group-hover:opacity-75 transition-opacity duration-300"></div>
            <div className="relative p-8 bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl">
              {/* Success Message */}
              {registrationSuccess && (
                <div className="mb-6 p-4 bg-green-500/10 backdrop-blur-sm border border-green-500/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-semibold text-green-600 dark:text-green-400">Registration Successful!</p>
                      <p className="text-sm text-green-600/80 dark:text-green-400/80">Please sign in with your credentials.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="font-semibold text-red-600 dark:text-red-400">Sign In Failed</p>
                      <p className="text-sm text-red-600/80 dark:text-red-400/80">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Form */}
              <form className="space-y-6" onSubmit={onSubmit}>
                <div className="space-y-4">
                  {/* Username Field */}
                  <div>
                    <label htmlFor="username" className="block text-sm font-semibold text-foreground mb-3">
                      Username
                    </label>
                    <div className="relative">
                      <input
                        id="username"
                        type="text"
                        required
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          if (error) setError(null);
                        }}
                        className="w-full px-4 py-3 bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 placeholder:text-muted-foreground"
                        placeholder="Enter your username"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-3">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (error) setError(null);
                        }}
                        className="w-full px-4 py-3 pr-12 bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 placeholder:text-muted-foreground"
                        placeholder="Enter your password"
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        variant="ghost"
                        size="icon"
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors h-8 w-8"
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Options */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        checked={rememberMe} 
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="sr-only"
                        disabled={loading}
                      />
                      <div className={`w-5 h-5 rounded border-2 transition-all duration-200 ${
                        rememberMe 
                          ? 'bg-primary border-primary' 
                          : 'border-border group-hover:border-primary/50'
                      }`}>
                        {rememberMe && (
                          <CheckCircle className="w-3 h-3 text-white absolute top-0.5 left-0.5" />
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-foreground">Remember me</span>
                  </label>
                  <Link 
                    href="/forgot-password" 
                    className="text-sm font-medium text-primary hover:text-accent transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading || !username.trim() || !password}
                  className="group relative w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:translate-y-0 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-center gap-2 text-sm sm:text-base">
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="hidden sm:inline">Signing in...</span>
                        <span className="sm:hidden">Signing in...</span>
                      </>
                    ) : (
                      <>
                        <LogIn01 className="w-5 h-5" />
                        <span className="hidden sm:inline">Sign In to Dashboard</span>
                        <span className="sm:hidden">Sign In</span>
                      </>
                    )}
                  </div>
                </Button>
              </form>

              {/* Footer Links */}
              <div className="mt-8 space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/50"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-card text-muted-foreground">New to the event?</span>
                  </div>
                </div>
                
                <Link 
                  href="/sign-up"
                  className="group w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 font-semibold text-sm sm:text-base"
                >
                  <span className="hidden sm:inline">Create Your Account</span>
                  <span className="sm:hidden">Create Account</span>
                  <div className="w-5 h-5 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ArrowLeft className="w-3 h-3 text-white rotate-180" />
                  </div>
                </Link>

                <Link 
                  href="/" 
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  Back to Event Homepage
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Info */}
          <div className="mt-8 text-center">
              <p className="text-xs text-muted-foreground">
              By signing in, you agree to participate in the BizArena virtual startup simulation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInPageContent />
    </Suspense>
  );
}