"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
// UI icons from @untitled-ui/icons-react
import { Scale01, ArrowLeft, Eye, EyeOff, Zap, Scales01, AlertCircle } from "@untitled-ui/icons-react";

export default function JudgeLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/judge/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });
      
      const result = await res.json();
      
      if (!res.ok || !result.success) {
        setError(result.error || "Invalid credentials");
        setLoading(false);
        return;
      }
      
      // Successful login - redirect with a small delay to ensure cookies are set
      setTimeout(() => {
        window.location.href = "/judge";
      }, 500);
      
    } catch (err: any) {
      setError("Login failed. Please try again.");
      setLoading(false);
    }
  };

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
              Judge Portal
            </h2>
            <p className="text-muted-foreground">Sign in to access the judging panel</p>
          </div>

          {/* Main Form Card */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-accent/50 rounded-2xl blur opacity-25 group-hover:opacity-75 transition-opacity duration-300"></div>
            <div className="relative p-8 bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl">
              
              {/* Judge Notice */}
              <div className="mb-6 p-4 bg-purple-500/10 backdrop-blur-sm border border-purple-500/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <Scales01 className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="font-semibold text-purple-600 dark:text-purple-400">Judge Access</p>
                    <p className="text-sm text-purple-600/80 dark:text-purple-400/80">Evaluation and scoring portal for judges</p>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="font-semibold text-red-600 dark:text-red-400">Authentication Failed</p>
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
                      Judge Username
                    </label>
                    <div className="relative">
                      <input
                        id="username"
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-3 bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 placeholder:text-muted-foreground"
                        placeholder="Enter judge username"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-3">
                      Judge Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-12 bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 placeholder:text-muted-foreground"
                        placeholder="Enter judge password"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors h-8 w-8 flex items-center justify-center"
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !username.trim() || !password}
                  className="group relative w-full px-6 py-4 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <Scale01 className="w-5 h-5" />
                        Access Judge Portal
                      </>
                    )}
                  </div>
                </button>
              </form>

              {/* Footer Links */}
              <div className="mt-8 space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/50"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-card text-muted-foreground">Need help?</span>
                  </div>
                </div>
                
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Contact the event organizers for judge credentials
                  </p>
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
          </div>

          {/* Bottom Info */}
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              Judge portal access is provided by event organizers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}