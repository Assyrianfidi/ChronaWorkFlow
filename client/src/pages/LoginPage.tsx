import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Button from "../components/ui/Button";
import Logo from "../assets/chronaworkflow-logo.png";
import { InputWithIcon } from "../components/ui/InputWithIcon";
import Label from "../components/ui/Label";
import {
  default as Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Alert, AlertDescription } from "../components/ui/Alert";
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const LoginPage: React.FC = () => {
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = React.useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.type === "checkbox" ? e.target.checked : e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoading(true);

    try {
      await login(formData.email, formData.password);

      // Store remember me preference
      if (formData.rememberMe) {
        localStorage.setItem("accubooks_remember", formData.email);
      } else {
        localStorage.removeItem("accubooks_remember");
      }

      navigate("/dashboard");
    } catch (error) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError("");
    setIsLoading(true);
    try {
      await login("admin@accubooks.com", "admin123");
      navigate("/dashboard");
    } catch (err) {
      setError("Unable to start demo session. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Load remembered email on mount
  React.useEffect(() => {
    const rememberedEmail = localStorage.getItem("accubooks_remember");
    if (rememberedEmail) {
      setFormData((prev) => ({
        ...prev,
        email: rememberedEmail,
        rememberMe: true,
      }));
    }
  }, []);

  const demoAccounts = [
    {
      email: "admin@accubooks.com",
      password: "admin123",
      role: "Administrator",
    },
    { email: "manager@accubooks.com", password: "manager123", role: "Manager" },
    { email: "user@accubooks.com", password: "user123", role: "User" },
    { email: "auditor@accubooks.com", password: "auditor123", role: "Auditor" },
    {
      email: "inventory@accubooks.com",
      password: "inventory123",
      role: "Inventory Manager",
    },
  ];

  return (
    <div className="min-h-screen soft-professional-gradient flex flex-col">
      {/* Background Pattern Overlay */}
      <div className="fixed inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231E4DB7' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>

      {/* Main Content */}
      <div
        role="main"
        className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative z-10"
      >
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <img
                src={Logo}
                alt="AccuBooks Enterprise Logo"
                width={128}
                height={128}
                loading="lazy"
                className="rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
              />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight">
              Welcome to AccuBooks
            </h1>
            <p className="text-lg text-muted-foreground font-normal">
              Sign in to manage your business finances
            </p>
          </div>

          {/* Authentication Card */}
          <Card className="glass-card shadow-2xl border-0 animate-scale-in">
            <CardHeader className="space-y-2 pb-6">
              <CardTitle className="text-2xl font-bold text-center text-foreground">
                Sign In
              </CardTitle>
              <CardDescription className="text-center text-muted-foreground text-base">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <form
              onSubmit={handleSubmit}
              aria-label="Sign in to your AccuBooks account"
            >
              <CardContent className="space-y-5">
                {error && (
                  <Alert
                    variant="destructive"
                    className="border-0 shadow-md"
                    aria-live="polite"
                  >
                    <AlertDescription className="text-sm font-medium">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-semibold text-foreground"
                  >
                    Email Address
                  </Label>
                  <InputWithIcon
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    autoComplete="email"
                    icon={<Mail className="w-5 h-5" />}
                    iconPosition="left"
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-semibold text-foreground"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <InputWithIcon
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                      autoComplete="current-password"
                      icon={<Lock className="w-5 h-5" />}
                      iconPosition="left"
                      className="h-12 pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 transition-colors duration-200"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-3">
                    <input
                      id="rememberMe"
                      name="rememberMe"
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded transition-colors duration-200"
                      disabled={isLoading}
                    />
                    <Label
                      htmlFor="rememberMe"
                      className="text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      Remember me
                    </Label>
                  </div>
                  <Link
                    to="/forgot-password"
                    className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors duration-200 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              </CardContent>
              <div className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-black"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 text-base font-semibold"
                  disabled={isLoading}
                  onClick={handleDemoLogin}
                >
                  Continue as Demo
                </Button>
              </div>
              <CardFooter className="flex flex-col space-y-4 pt-6">
                <div className="text-center text-sm text-gray-600 font-medium">
                  Don&apos;t have an account?{" "}
                  <Link
                    to="/register"
                    className="font-semibold text-primary-600 hover:text-primary-700 transition-colors duration-200 hover:underline"
                  >
                    Sign up
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>

          {/* Demo Accounts - Collapsible Card */}
          <Card className="mt-6 glass-card border border-gray-200 animate-slide-in-from-bottom">
            <CardContent className="p-0">
              <Button
                type="button"
                variant="ghost"
                className="w-full h-12 rounded-t-lg rounded-b-none border-0 font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center justify-between px-6"
                onClick={() => setShowDemoAccounts(!showDemoAccounts)}
              >
                <span>Demo Accounts</span>
                {showDemoAccounts ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>

              {showDemoAccounts && (
                <div className="px-6 pb-6 pt-2 animate-fade-in">
                  <div className="space-y-3">
                    {demoAccounts.map((account, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-primary-300 transition-colors duration-200"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm text-gray-900">
                            {account.role}
                          </span>
                          <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded">
                            Quick Access
                          </span>
                        </div>
                        <div className="text-xs font-mono text-gray-600">
                          {account.email} / {account.password}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-600">
            <Link
              to="/privacy"
              className="hover:text-primary-600 transition-colors duration-200 font-medium"
            >
              Privacy Policy
            </Link>
            <span className="hidden sm:inline text-gray-400">•</span>
            <Link
              to="/terms"
              className="hover:text-primary-600 transition-colors duration-200 font-medium"
            >
              Terms of Service
            </Link>
            <span className="hidden sm:inline text-gray-400">•</span>
            <span className="font-medium">© AccuBooks 2025</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
