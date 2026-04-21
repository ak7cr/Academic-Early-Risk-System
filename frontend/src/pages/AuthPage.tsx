import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { BookOpen, Eye, EyeOff, ArrowLeft, Moon, Sun } from "lucide-react";
import { auth } from "../lib/api";
import { useTheme } from "../lib/ThemeContext";

type Tab = "login" | "signup";

export function AuthPage() {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // SignUp fields
  const [name, setName] = useState("");
  const [idNumber, setIdNumber] = useState(""); // Reg No for student, Faculty No for faculty
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { theme, toggleTheme } = useTheme();
  const isFaculty = role === "faculty";
  const accentColor = isFaculty ? "#9333EA" : "#2563EB";
  const accentHover = isFaculty ? "#7e22ce" : "#1d4ed8";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await auth.login(loginEmail, loginPassword);
      localStorage.setItem("token", res.access_token);
      localStorage.setItem("user", JSON.stringify(res.user));
      navigate(res.user.role === "faculty" ? "/faculty/dashboard" : "/student/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (signupPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (signupPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const payload: Parameters<typeof auth.register>[0] = {
        email: signupEmail,
        password: signupPassword,
        name,
        role: isFaculty ? "faculty" : "student",
        ...(isFaculty
          ? { department: department.trim() || undefined }
          : {
              student_id: idNumber.trim() || undefined,
              department: department.trim() || undefined,
              year: year ? Number(year) : undefined,
            }),
      };
      const res = await auth.register(payload);
      localStorage.setItem("token", res.access_token);
      localStorage.setItem("user", JSON.stringify(res.user));
      navigate(res.user.role === "faculty" ? "/faculty/dashboard" : "/student/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-[#2563EB] via-[#3B82F6] to-[#6366F1] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-8 relative">
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2.5 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
        aria-label="Toggle dark mode"
      >
        {theme === "dark" ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-white" />}
      </button>
      <div className="w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-white/80 hover:text-white mb-6 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Role Selection
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-8 pb-6 text-center">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4"
              style={{ backgroundColor: `${accentColor}15` }}
            >
              <BookOpen className="w-7 h-7" style={{ color: accentColor }} strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isFaculty ? "Faculty" : "Student"} Portal
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">AREWS — Academic Risk Early-Warning System</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mx-8">
            <button
              onClick={() => { setTab("login"); setError(""); }}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 ${
                tab === "login"
                  ? "border-current text-gray-900 dark:text-white"
                  : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
              }`}
              style={tab === "login" ? { color: accentColor, borderColor: accentColor } : {}}
            >
              Log In
            </button>
            <button
              onClick={() => { setTab("signup"); setError(""); }}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 ${
                tab === "signup"
                  ? "border-current text-gray-900 dark:text-white"
                  : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
              }`}
              style={tab === "signup" ? { color: accentColor, borderColor: accentColor } : {}}
            >
              Sign Up
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mx-8 mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="p-8 pt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@university.edu"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent outline-none transition-shadow text-sm bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  style={{ "--tw-ring-color": accentColor } as React.CSSProperties}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent outline-none transition-shadow text-sm bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    style={{ "--tw-ring-color": accentColor } as React.CSSProperties}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 text-white font-semibold rounded-lg transition-colors text-sm disabled:opacity-50"
                style={{ backgroundColor: accentColor }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = accentHover)}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = accentColor)}
              >
                {loading ? "Logging in..." : "Log In"}
              </button>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Don't have an account?{" "}
                <button type="button" onClick={() => { setTab("signup"); setError(""); }} className="font-semibold hover:underline" style={{ color: accentColor }}>
                  Sign Up
                </button>
              </p>
            </form>
          )}

          {/* Sign Up Form */}
          {tab === "signup" && (
            <form onSubmit={handleSignUp} className="p-8 pt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isFaculty ? "Dr. Jane Smith" : "John Doe"}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent outline-none transition-shadow text-sm bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  style={{ "--tw-ring-color": accentColor } as React.CSSProperties}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {isFaculty ? "Faculty No." : "Reg No."}
                </label>
                <input
                  type="text"
                  required
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder={isFaculty ? "FAC-2024-001" : "2024001"}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent outline-none transition-shadow text-sm bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  style={{ "--tw-ring-color": accentColor } as React.CSSProperties}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder={isFaculty ? "Computer Science" : "Computer Science"}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent outline-none transition-shadow text-sm bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  style={{ "--tw-ring-color": accentColor } as React.CSSProperties}
                />
              </div>
              {!isFaculty && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Year of Study</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent outline-none transition-shadow text-sm bg-white dark:bg-gray-700 dark:text-white"
                    style={{ "--tw-ring-color": accentColor } as React.CSSProperties}
                  >
                    <option value="">Select year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="you@university.edu"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent outline-none transition-shadow text-sm bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  style={{ "--tw-ring-color": accentColor } as React.CSSProperties}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent outline-none transition-shadow text-sm bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    style={{ "--tw-ring-color": accentColor } as React.CSSProperties}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Re-enter Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent outline-none transition-shadow text-sm bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    style={{ "--tw-ring-color": accentColor } as React.CSSProperties}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 text-white font-semibold rounded-lg transition-colors text-sm disabled:opacity-50"
                style={{ backgroundColor: accentColor }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = accentHover)}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = accentColor)}
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Already have an account?{" "}
                <button type="button" onClick={() => { setTab("login"); setError(""); }} className="font-semibold hover:underline" style={{ color: accentColor }}>
                  Log In
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
