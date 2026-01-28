import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Crown, User, Lock, ArrowRight } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const isAdmin = username.toLowerCase() === "admin";

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      navigate("/");
    }
  }, [navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Будь ласка, заповніть всі поля");
      return;
    }

    if (username.toLowerCase() === "admin" && password === "admin123") {
      localStorage.setItem("authToken", "admin-token");
      localStorage.setItem("userRole", "admin");
      localStorage.setItem("username", username);
      navigate("/");
    } else if (password === "user123") {
      const subscriptionEnd = localStorage.getItem(`subscription_${username}`);
      const now = new Date().getTime();

      if (subscriptionEnd && parseInt(subscriptionEnd) > now) {
        localStorage.setItem("authToken", "user-token");
        localStorage.setItem("userRole", "user");
        localStorage.setItem("username", username);
        navigate("/");
      } else {
        setError("Ваша підписка закінчилася. Зверніться до адміністратора.");
      }
    } else {
      setError("Невірний логін або пароль");
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Blue gradient circles */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,102,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,102,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Main login container */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo/Brand section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-600/20">
            <span className="text-white text-2xl font-bold">CS</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Вітаємо знову
          </h1>
          <p className="text-gray-500 text-sm">
            Увійдіть до свого облікового запису
          </p>
        </div>

        {/* Login form card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          {/* Admin indicator */}
          {isAdmin && (
            <div className="mb-6 flex items-center justify-center gap-2 py-3 px-4 bg-blue-50 rounded-2xl border border-blue-100">
              <Crown className="w-5 h-5 text-blue-600 animate-pulse" />
              <span className="text-sm font-semibold text-blue-700">
                Режим адміністратора
              </span>
            </div>
          )}

          {/* Error alert */}
          {error && (
            <Alert className="mb-6 bg-red-50 border-red-200 rounded-2xl">
              <AlertDescription className="text-red-700 text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block">
                Ім'я користувача
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors group-focus-within:text-blue-600" />
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`pl-12 h-14 bg-gray-50 border-gray-200 rounded-2xl text-base transition-all duration-200 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 ${
                    isAdmin ? "blur-sm focus:blur-none" : ""
                  }`}
                  placeholder="Введіть ім'я користувача"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block">
                Пароль
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors group-focus-within:text-blue-600" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 h-14 bg-gray-50 border-gray-200 rounded-2xl text-base transition-all duration-200 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                  placeholder="Введіть пароль"
                />
              </div>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              className="w-full h-14 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-bold text-base rounded-2xl shadow-lg shadow-yellow-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-yellow-500/30 hover:scale-[1.02] active:scale-[0.98] group"
            >
              <span>Увійти</span>
              <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </form>

          {/* Additional info */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-center text-sm text-gray-500">
              Потрібна допомога?{" "}
              <a
                href="#"
                className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
              >
                Зв'яжіться з підтримкою
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            © 2026 CS Betting Platform. Всі права захищені.
          </p>
        </div>
      </div>

      {/* Decorative elements */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}