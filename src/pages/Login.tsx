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
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated liquid background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large liquid blob 1 */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-white/10 via-gray-500/5 to-transparent rounded-full blur-3xl animate-blob" />
        
        {/* Large liquid blob 2 */}
        <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-gradient-to-tl from-white/8 via-gray-400/5 to-transparent rounded-full blur-3xl animate-blob animation-delay-2000" />
        
        {/* Medium liquid blob 3 */}
        <div className="absolute top-1/3 right-1/3 w-[500px] h-[500px] bg-gradient-to-br from-gray-300/5 via-white/5 to-transparent rounded-full blur-3xl animate-blob animation-delay-4000" />
        
        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-white/20 rounded-full animate-float" />
        <div className="absolute top-2/3 right-1/4 w-3 h-3 bg-white/15 rounded-full animate-float animation-delay-1000" />
        <div className="absolute bottom-1/4 left-1/2 w-2 h-2 bg-white/25 rounded-full animate-float animation-delay-2000" />
        <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-white/20 rounded-full animate-float animation-delay-3000" />
        
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Main login container */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo/Brand section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl mb-6 shadow-2xl shadow-white/10 hover:scale-105 transition-transform duration-300">
            <span className="text-black text-3xl font-bold">CS</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            Вітаємо знову
          </h1>
          <p className="text-gray-400 text-base">
            Увійдіть до свого облікового запису
          </p>
        </div>

        {/* Login form card with glassmorphism */}
        <div className="relative group">
          {/* Glow effect on hover */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-white/20 via-gray-500/20 to-white/20 rounded-[2rem] blur opacity-0 group-hover:opacity-100 transition duration-500" />
          
          <div className="relative bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 p-8 shadow-2xl">
            {/* Admin indicator */}
            {isAdmin && (
              <div className="mb-6 flex items-center justify-center gap-2 py-3 px-5 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                <Crown className="w-5 h-5 text-white animate-pulse" />
                <span className="text-sm font-bold text-white">
                  Режим адміністратора
                </span>
              </div>
            )}

            {/* Error alert */}
            {error && (
              <Alert className="mb-6 bg-red-500/10 border-red-500/30 backdrop-blur-sm rounded-2xl">
                <AlertDescription className="text-red-300 text-sm font-medium">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Login form */}
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Username field */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-white/90 block tracking-wide">
                  Ім'я користувача
                </label>
                <div className="relative group/input">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors duration-200 group-focus-within/input:text-white" />
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`pl-12 h-14 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-gray-500 text-base transition-all duration-300 hover:bg-white/10 focus:bg-white/10 focus:border-white/30 focus:ring-4 focus:ring-white/10 ${
                      isAdmin ? "blur-sm focus:blur-none" : ""
                    }`}
                    placeholder="Введіть ім'я користувача"
                  />
                  {/* Input glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-white/90 block tracking-wide">
                  Пароль
                </label>
                <div className="relative group/input">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors duration-200 group-focus-within/input:text-white" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-14 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-gray-500 text-base transition-all duration-300 hover:bg-white/10 focus:bg-white/10 focus:border-white/30 focus:ring-4 focus:ring-white/10"
                    placeholder="Введіть пароль"
                  />
                  {/* Input glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              </div>

              {/* Submit button with liquid effect */}
              <div className="relative group/button">
                {/* Button glow */}
                <div className="absolute -inset-1 bg-white rounded-2xl blur-lg opacity-25 group-hover/button:opacity-50 transition duration-300" />
                
                <Button
                  type="submit"
                  className="relative w-full h-14 bg-white hover:bg-gray-100 text-black font-bold text-base rounded-2xl shadow-2xl shadow-white/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden group/btn"
                >
                  {/* Liquid shine effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  
                  <span className="relative flex items-center justify-center gap-2">
                    Увійти
                    <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1 duration-300" />
                  </span>
                </Button>
              </div>
            </form>

            {/* Additional info */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-center text-sm text-gray-400">
                Потрібна допомога?{" "}
                <a
                  href="#"
                  className="text-white font-bold hover:text-gray-300 transition-colors duration-200 relative group/link"
                >
                  Зв'яжіться з підтримкою
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover/link:w-full transition-all duration-300" />
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-600">
            © 2026 CS Betting Platform. Всі права захищені.
          </p>
        </div>
      </div>

      {/* Advanced animations */}
      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(20px, -50px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          75% {
            transform: translate(50px, 50px) scale(1.05);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.3;
          }
          25% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-40px) translateX(-10px);
            opacity: 0.8;
          }
          75% {
            transform: translateY(-20px) translateX(5px);
            opacity: 0.5;
          }
        }
        
        .animate-blob {
          animation: blob 20s ease-in-out infinite;
        }
        
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-3000 {
          animation-delay: 3s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}