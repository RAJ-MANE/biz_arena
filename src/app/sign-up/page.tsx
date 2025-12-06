"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RulesDialog } from "@/components/ui/RulesDialog";
import { UserPlus01, ArrowLeft, Clock, Zap, CheckCircle, AlertCircle, Eye, EyeOff } from "@untitled-ui/icons-react";

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    confirmPassword: "",
    teamName: "",
    college: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showRulesDialog, setShowRulesDialog] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<{
    isOpen: boolean;
    deadline?: string;
    message?: string;
  }>({ isOpen: true });

  // Check registration deadline on component mount
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      try {
        const response = await fetch('/api/registration-status');
        if (response.ok) {
          const status = await response.json();
          setRegistrationStatus(status);
        } else {
          // If endpoint fails, assume registration is open
          setRegistrationStatus({ isOpen: true });
        }
      } catch (err) {
        console.error('Failed to check registration status:', err);
        // If we can't check the status, assume registration is open
        setRegistrationStatus({ isOpen: true });
      }
    };

    checkRegistrationStatus();
  }, []);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    } else if (formData.name.length > 100) {
      errors.name = "Name must be less than 100 characters";
    }

    if (!formData.username.trim()) {
      errors.username = "Username is required";
    } else if (formData.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    } else if (formData.username.length > 50) {
      errors.username = "Username must be less than 50 characters";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      errors.username = "Username can only contain letters, numbers, hyphens, and underscores";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 10) {
      errors.password = "Password must be at least 10 characters";
    } else if (!/[A-Z]/.test(formData.password)) {
      errors.password = "Password must include at least one uppercase letter";
    } else if (!/[a-z]/.test(formData.password)) {
      errors.password = "Password must include at least one lowercase letter";
    } else if (!/[0-9]/.test(formData.password)) {
      errors.password = "Password must include at least one number";
    } else if (!/[^A-Za-z0-9]/.test(formData.password)) {
      errors.password = "Password must include at least one special character";
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (!formData.teamName.trim()) {
      errors.teamName = "Team name is required";
    } else if (formData.teamName.length > 100) {
      errors.teamName = "Team name must be less than 100 characters";
    }

    if (!formData.college.trim()) {
      errors.college = "College is required";
    } else if (formData.college.length > 200) {
      errors.college = "College name must be less than 200 characters";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: "" }));
    }
    // Clear general error when user makes any change
    if (error) {
      setError(null);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }
    
    // Show rules dialog before submitting
    setShowRulesDialog(true);
    setPendingSubmit(true);
  };

  const handleRulesAccept = async () => {
    setShowRulesDialog(false);
    setLoading(true);
    setError(null);
    setFieldErrors({});
    
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          username: formData.username.trim().toLowerCase(),
          password: formData.password,
          teamName: formData.teamName.trim(),
          college: formData.college.trim(),
        })
      });
      
      const result = await res.json();
      
      if (!res.ok || !result.success) {
        const errorMsg = result.error || "Registration failed";
        setError(errorMsg);
        
        // Set field-specific errors for better UX
        if (errorMsg.toLowerCase().includes('username')) {
          setFieldErrors(prev => ({ ...prev, username: errorMsg }));
        } else if (errorMsg.toLowerCase().includes('team name')) {
          setFieldErrors(prev => ({ ...prev, teamName: errorMsg }));
        } else if (errorMsg.toLowerCase().includes('password')) {
          setFieldErrors(prev => ({ ...prev, password: errorMsg }));
        }
        return;
      }

      // Redirect to sign-in page with success message
      router.push("/sign-in?registered=true");
      
    } catch (err: any) {
      console.error('Registration error:', err);
      const errorMsg = err?.message || "Network error. Please try again.";
      setError(errorMsg);
    } finally {
      setLoading(false);
      setPendingSubmit(false);
    }
  };

  const handleRulesCancel = () => {
    setShowRulesDialog(false);
    setPendingSubmit(false);
  };

  const isFormValid = Object.values(formData).every(value => value.trim()) && 
                     formData.password === formData.confirmPassword &&
                     Object.keys(fieldErrors).length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 text-foreground overflow-x-hidden">
      {/* Rules Dialog */}
      <RulesDialog 
        open={showRulesDialog}
        onAccept={handleRulesAccept}
        onCancel={handleRulesCancel}
      />

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
              Join the Competition
            </h2>
            <p className="text-muted-foreground">Create your account to participate</p>
          </div>

          {/* Main Form Card */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-accent/50 rounded-2xl blur opacity-25 group-hover:opacity-75 transition-opacity duration-300 pointer-events-none" style={{ willChange: 'opacity, transform' }}></div>
            <div className="relative p-8 bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl">
              
              {/* Registration Status */}
              {registrationStatus.message && (
                <div className={`mb-6 p-4 backdrop-blur-sm border rounded-xl ${
                  registrationStatus.isOpen 
                    ? 'bg-green-500/10 border-green-500/20' 
                    : 'bg-red-500/10 border-red-500/20'
                }`}>
                  <div className="flex items-center gap-3">
                    <CheckCircle className={`w-5 h-5 ${
                      registrationStatus.isOpen ? 'text-green-500' : 'text-red-500'
                    }`} />
                    <div>
                      <p className={`font-semibold ${
                        registrationStatus.isOpen 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {registrationStatus.isOpen ? 'Registration Open' : 'Registration Closed'}
                      </p>
                      <p className={`text-sm ${
                        registrationStatus.isOpen 
                          ? 'text-green-600/80 dark:text-green-400/80' 
                          : 'text-red-600/80 dark:text-red-400/80'
                      }`}>
                        {registrationStatus.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Registration Closed Message */}
              {!registrationStatus.isOpen ? (
                <div className="text-center space-y-6">
                  <div className="p-6 bg-red-500/5 backdrop-blur-sm border border-red-500/10 rounded-xl">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                        <Clock className="w-6 h-6 text-red-500" />
                      </div>
                      <h3 className="text-xl font-bold text-red-600 dark:text-red-400">Registration Closed</h3>
                    </div>
                    <p className="text-muted-foreground">
                      The registration deadline has passed. New team registrations are no longer accepted.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <Link
                      href="/sign-in"
                      className="group w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="relative flex items-center gap-2">
                        Already have an account? Sign In
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
              ) : (
                <>
                  {/* Error Message */}
                  {error && (
                    <div className="mb-6 p-4 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <div>
                          <p className="font-semibold text-red-600 dark:text-red-400">Registration Failed</p>
                          <p className="text-sm text-red-600/80 dark:text-red-400/80">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form */}
                  <form className="space-y-4" onSubmit={onSubmit}>
                    <div className="grid grid-cols-1 gap-4">
                      {/* Name Field */}
                      <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-foreground mb-3">
                          Full Name
                        </label>
                        <input
                          id="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          className={`w-full px-4 py-3 bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 placeholder:text-muted-foreground ${
                            fieldErrors.name ? "border-red-500/50 focus:ring-red-500/50" : ""
                          }`}
                          placeholder="Enter your full name"
                          disabled={loading}
                        />
                        {fieldErrors.name && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{fieldErrors.name}</p>}
                      </div>

                      {/* Username Field */}
                      <div>
                        <label htmlFor="username" className="block text-sm font-semibold text-foreground mb-3">
                          Username
                        </label>
                        <input
                          id="username"
                          type="text"
                          required
                          value={formData.username}
                          onChange={(e) => handleInputChange("username", e.target.value)}
                          className={`w-full px-4 py-3 bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 placeholder:text-muted-foreground ${
                            fieldErrors.username ? "border-red-500/50 focus:ring-red-500/50" : ""
                          }`}
                          placeholder="Choose a unique username"
                          disabled={loading}
                        />
                        {fieldErrors.username && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{fieldErrors.username}</p>}
                      </div>

                      {/* Password Fields Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              value={formData.password}
                              onChange={(e) => handleInputChange("password", e.target.value)}
                              className={`w-full px-4 py-3 pr-12 bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 placeholder:text-muted-foreground ${
                                fieldErrors.password ? "border-red-500/50 focus:ring-red-500/50" : ""
                              }`}
                              placeholder="Create password"
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
                          {fieldErrors.password && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{fieldErrors.password}</p>}
                          {!fieldErrors.password && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Must be 10+ characters with uppercase, lowercase, number, and special character
                            </p>
                          )}
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                          <label htmlFor="confirmPassword" className="block text-sm font-semibold text-foreground mb-3">
                            Confirm Password
                          </label>
                          <div className="relative">
                            <input
                              id="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              required
                              value={formData.confirmPassword}
                              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                              className={`w-full px-4 py-3 pr-12 bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 placeholder:text-muted-foreground ${
                                fieldErrors.confirmPassword ? "border-red-500/50 focus:ring-red-500/50" : ""
                              }`}
                              placeholder="Confirm password"
                              disabled={loading}
                            />
                            <Button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              variant="ghost"
                              size="icon"
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors h-8 w-8"
                              disabled={loading}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="w-5 h-5" />
                              ) : (
                                <Eye className="w-5 h-5" />
                              )}
                            </Button>
                          </div>
                          {fieldErrors.confirmPassword && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{fieldErrors.confirmPassword}</p>}
                        </div>
                      </div>

                      {/* Team Name Field */}
                      <div>
                        <label htmlFor="teamName" className="block text-sm font-semibold text-foreground mb-3">
                          Team Name
                        </label>
                        <input
                          id="teamName"
                          type="text"
                          required
                          value={formData.teamName}
                          onChange={(e) => handleInputChange("teamName", e.target.value)}
                          className={`w-full px-4 py-3 bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 placeholder:text-muted-foreground ${
                            fieldErrors.teamName ? "border-red-500/50 focus:ring-red-500/50" : ""
                          }`}
                          placeholder="Choose your team name"
                          disabled={loading}
                        />
                        {fieldErrors.teamName && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{fieldErrors.teamName}</p>}
                      </div>

                      {/* College Field */}
                      <div>
                        <label htmlFor="college" className="block text-sm font-semibold text-foreground mb-3">
                          College/University
                        </label>
                        <input
                          id="college"
                          type="text"
                          required
                          value={formData.college}
                          onChange={(e) => handleInputChange("college", e.target.value)}
                          className={`w-full px-4 py-3 bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 placeholder:text-muted-foreground ${
                            fieldErrors.college ? "border-red-500/50 focus:ring-red-500/50" : ""
                          }`}
                          placeholder="Your college or university name"
                          disabled={loading}
                        />
                        {fieldErrors.college && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{fieldErrors.college}</p>}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={loading || !isFormValid}
                      className="group relative w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:translate-y-0 overflow-hidden mt-6"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative flex items-center justify-center gap-2 text-sm sm:text-base">
                        {loading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span className="hidden sm:inline">Creating Account...</span>
                            <span className="sm:hidden">Creating...</span>
                          </>
                        ) : (
                          <>
                            <UserPlus01 className="w-5 h-5" />
                            <span className="hidden sm:inline">Create Account & Join</span>
                            <span className="sm:hidden">Create Account</span>
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
                        <span className="px-4 bg-card text-muted-foreground">Already registered?</span>
                      </div>
                    </div>
                    
                    <Link 
                      href="/sign-in"
                      className="group w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 font-semibold text-sm sm:text-base"
                    >
                      <span className="hidden sm:inline">Sign In to Dashboard</span>
                      <span className="sm:hidden">Sign In</span>
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
                </>
              )}
            </div>
          </div>

          {/* Bottom Info */}
          <div className="mt-8 text-center">
              <p className="text-xs text-muted-foreground">
                    By creating an account, you agree to participate in the BizArena virtual startup simulation
                  </p>
          </div>
        </div>
      </div>
    </div>
  );
}