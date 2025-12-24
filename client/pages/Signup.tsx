import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, Mail, Lock, Eye, EyeOff, User, Check } from "lucide-react";
import { DarkLayout } from "@/components/DarkLayout";
import { toast } from "sonner";

export default function Signup() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.includes("@")) {
      newErrors.email = "Valid email is required";
    }

    if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Signup failed");
      }

      localStorage.setItem("token", data.token);
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    const password = formData.password;
    if (password.length === 0) return { label: "", color: "", width: "0%" };
    if (password.length < 6) return { label: "Weak", color: "bg-red-500", width: "25%" };
    if (password.length < 8) return { label: "Fair", color: "bg-yellow-500", width: "50%" };
    if (password.length < 12) return { label: "Good", color: "bg-blue-500", width: "75%" };
    return { label: "Strong", color: "bg-green-500", width: "100%" };
  };

  const strength = getPasswordStrength();

  return (
    <DarkLayout>
      <div className="min-h-screen flex">
        {/* Left Side - Features */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12">
          <div className="max-w-lg">
            <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">
              Start tracking your
            </h1>
            <h2 className="text-4xl font-bold text-gradient-purple mb-6">
              Stripe revenue
            </h2>
            <p className="text-lg text-[var(--text-secondary)] mb-10">
              Join thousands of founders monitoring their business metrics.
            </p>

            <div className="space-y-5">
              {[
                { icon: "📊", text: "Real-time MRR & ARR tracking" },
                { icon: "📈", text: "Subscription analytics & churn insights" },
                { icon: "🔔", text: "Failed payment monitoring & recovery" },
                { icon: "🔒", text: "Bank-grade security, read-only access" },
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-xl">{feature.icon}</span>
                  <p className="text-[var(--text-primary)]">{feature.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="glass-card p-6 sm:p-8 w-full max-w-md">
            <div className="text-center mb-6 sm:mb-8 lg:hidden">
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">Create Account</h1>
              <p className="text-sm text-[var(--text-muted)]">Start your free trial</p>
            </div>
            <div className="hidden lg:block text-center mb-8">
              <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Create Account</h1>
              <p className="text-[var(--text-muted)]">Start your free trial</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Full Name <span className="text-purple-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-dark pl-11"
                    placeholder="John Doe"
                    disabled={isLoading}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Email <span className="text-purple-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-dark pl-11"
                    placeholder="you@example.com"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Password <span className="text-purple-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input-dark pl-11 pr-11"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {/* Password Strength Bar */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      <div className={`h-1 flex-1 rounded ${formData.password.length >= 1 ? 'bg-red-500' : 'bg-[var(--border-subtle)]'}`} />
                      <div className={`h-1 flex-1 rounded ${formData.password.length >= 6 ? 'bg-yellow-500' : 'bg-[var(--border-subtle)]'}`} />
                      <div className={`h-1 flex-1 rounded ${formData.password.length >= 8 ? 'bg-blue-500' : 'bg-[var(--border-subtle)]'}`} />
                      <div className={`h-1 flex-1 rounded ${formData.password.length >= 12 ? 'bg-green-500' : 'bg-[var(--border-subtle)]'}`} />
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">Password strength: {strength.label}</p>
                  </div>
                )}
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Confirm Password <span className="text-purple-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="input-dark pl-11 pr-11"
                    placeholder="Confirm your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer touch-manipulation">
                <input
                  type="checkbox"
                  className="w-4 h-4 mt-0.5 rounded border-[var(--border-subtle)] bg-transparent text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
                />
                <span className="text-xs sm:text-sm text-[var(--text-secondary)]">
                  I agree to the{" "}
                  <Link to="/terms" className="text-purple-400 hover:text-purple-300 underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="text-purple-400 hover:text-purple-300 underline">
                    Privacy Policy
                  </Link>
                </span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full mt-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            {/* Sign In Link */}
            <p className="text-center text-sm sm:text-base text-[var(--text-muted)] mt-6">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-purple-400 hover:text-purple-300 transition-colors touch-manipulation">
                Sign in
              </Link>
            </p>

            {/* Footer */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-[var(--border-subtle)]">
              <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <Lock className="w-3.5 h-3.5" />
                SSL Secured
              </span>
              <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Privacy First
              </span>
            </div>
          </div>
        </div>
      </div>
    </DarkLayout>
  );
}
