import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Crown, User, Lock, ArrowRight, TrendingUp, Loader2 } from "lucide-react";
import { authService } from "@/lib/authService";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const isAuthenticating = useRef(false);

  const isAdmin = username.toLowerCase() === "admin" || username.toLowerCase() === "super_gus23_7482";

  useEffect(() => {
    // Clear any existing auth tokens when login page loads
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("username");
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isAuthenticating.current) {
      return;
    }
    
    setError("");
    setIsLoading(true);
    isAuthenticating.current = true;

    try {
      if (!username || !password) {
        setError("Будь ласка, заповніть всі поля");
        setIsLoading(false);
        isAuthenticating.current = false;
        return;
      }

      const validation = await authService.validateUser(username, password);

      if (validation.isValid) {
        const isAdminUser = await authService.validateAdmin(username, password);
        
        if (isAdminUser) {
          localStorage.setItem("authToken", "admin-token");
          localStorage.setItem("userRole", "admin");
          localStorage.setItem("username", username);
        } else {
          localStorage.setItem("authToken", "user-token");
          localStorage.setItem("userRole", "user");
          localStorage.setItem("username", username);
        }
        
        navigate("/", { replace: true });
      } else {
        setError(validation.message || "Невірний логін або пароль");
        setIsLoading(false);
        isAuthenticating.current = false;
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Помилка з'єднання. Спробуйте ще раз.");
      setIsLoading(false);
      isAuthenticating.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* iOS 18 Liquid Glass Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"
          style={{
            maskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)'
          }}
        />
        
        {/* Liquid glass blobs - iOS 18 style */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-blue-100/30 via-purple-100/20 to-transparent rounded-full blur-3xl animate-blob-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] bg-gradient-to-tl from-pink-100/25 via-blue-100/20 to-transparent rounded-full blur-3xl animate-blob-slow animation-delay-4000" />
        <div className="absolute top-1/2 right-1/3 w-[550px] h-[550px] bg-gradient-to-br from-purple-100/20 via-blue-100/15 to-transparent rounded-full blur-3xl animate-blob-slow animation-delay-8000" />
        
        {/* Floating glass particles */}
        <div className="absolute top-1/3 left-1/3 w-2 h-2 bg-white/40 rounded-full animate-float-gentle shadow-lg backdrop-blur-sm" />
        <div className="absolute top-2/3 right-1/4 w-3 h-3 bg-white/30 rounded-full animate-float-gentle animation-delay-2000 shadow-lg backdrop-blur-sm" />
        <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-white/35 rounded-full animate-float-gentle animation-delay-4000 shadow-lg backdrop-blur-sm" />
        <div className="absolute top-1/2 right-1/2 w-2 h-2 bg-white/40 rounded-full animate-float-gentle animation-delay-6000 shadow-lg backdrop-blur-sm" />
      </div>

      {/* Main login container */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo/Brand section - iOS 18 style */}
        <div className="text-center mb-10">
          <div className="inline-flex flex-col items-center gap-4">
            {/* Logo with liquid glass effect */}
            <div className="relative group/logo">
              <div className="absolute -inset-2 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-[2rem] blur-2xl opacity-0 group-hover/logo:opacity-100 transition-all duration-700" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-black via-gray-900 to-black rounded-[1.75rem] shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex items-center justify-center backdrop-blur-xl border border-white/10 hover:scale-105 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-[1.75rem]" />
                <TrendingUp className="w-10 h-10 text-white relative z-10 drop-shadow-[0_2px_8px_rgba(255,255,255,0.3)]" />
              </div>
            </div>
            
            {/* App name */}
            <h2 className="text-3xl font-bold bg-gradient-to-r from-black via-gray-800 to-black bg-clip-text text-transparent tracking-tight">
              MatchIQ
            </h2>
          </div>
          
          <h1 className="text-4xl font-bold text-black mb-2 tracking-tight mt-8">
            Вітаємо знову
          </h1>
          <p className="text-gray-600 text-base font-medium">
            Увійдіть до свого облікового запису
          </p>
        </div>

        {/* Login form card - iOS 18 Liquid Glass */}
        <div className="relative group/card">
          {/* Outer glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-[2.5rem] blur-2xl opacity-0 group-hover/card:opacity-100 transition-all duration-700" />
          
          {/* Glass card */}
          <div className="relative bg-white/70 backdrop-blur-2xl rounded-[2.5rem] border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-8">
            {/* Inner glass shine */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/5 to-transparent rounded-[2.5rem] pointer-events-none" />
            
            {/* Content */}
            <div className="relative z-10">
              {/* Admin indicator */}
              {isAdmin && (
                <div className="mb-6 flex items-center justify-center gap-2 py-3 px-5 bg-black/5 backdrop-blur-xl rounded-[1.25rem] border border-black/10 shadow-lg">
                  <Crown className="w-5 h-5 text-black animate-pulse" />
                  <span className="text-sm font-bold text-black">
                    Режим адміністратора
                  </span>
                </div>
              )}

              {/* Error alert */}
              {error && (
                <Alert className="mb-6 bg-red-50/80 backdrop-blur-xl border border-red-200/50 rounded-[1.25rem] shadow-lg">
                  <AlertDescription className="text-red-700 text-sm font-medium">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Login form */}
              <form onSubmit={handleLogin} className="space-y-5">
                {/* Username field */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-black/80 block">
                    Ім'я користувача
                  </label>
                  <div className="relative group/input">
                    {/* Icon */}
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 transition-all duration-300 group-focus-within/input:text-black z-10" />
                    
                    {/* Input with liquid glass effect */}
                    <div className="relative">
                      <Input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={isLoading}
                        className="pl-12 h-14 bg-white/60 backdrop-blur-xl border border-gray-200/50 rounded-[1.25rem] text-black placeholder:text-gray-400 text-base transition-all duration-300 hover:bg-white/80 hover:border-gray-300/60 focus:bg-white/90 focus:border-black/20 focus:ring-4 focus:ring-black/5 disabled:opacity-50 shadow-[0_2px_16px_rgba(0,0,0,0.04)]"
                        placeholder="Введіть ім'я користувача"
                      />
                      {/* Glass shine overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-[1.25rem] pointer-events-none" />
                      {/* Focus glow */}
                      <div className="absolute inset-0 rounded-[1.25rem] opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500 shadow-[inset_0_0_20px_rgba(0,0,0,0.03)] pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Password field */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-black/80 block">
                    Пароль
                  </label>
                  <div className="relative group/input">
                    {/* Icon */}
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 transition-all duration-300 group-focus-within/input:text-black z-10" />
                    
                    {/* Input with liquid glass effect */}
                    <div className="relative">
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        className="pl-12 h-14 bg-white/60 backdrop-blur-xl border border-gray-200/50 rounded-[1.25rem] text-black placeholder:text-gray-400 text-base transition-all duration-300 hover:bg-white/80 hover:border-gray-300/60 focus:bg-white/90 focus:border-black/20 focus:ring-4 focus:ring-black/5 disabled:opacity-50 shadow-[0_2px_16px_rgba(0,0,0,0.04)]"
                        placeholder="Введіть пароль"
                      />
                      {/* Glass shine overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-[1.25rem] pointer-events-none" />
                      {/* Focus glow */}
                      <div className="absolute inset-0 rounded-[1.25rem] opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500 shadow-[inset_0_0_20px_rgba(0,0,0,0.03)] pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Submit button - iOS 18 Liquid Glass style */}
                <div className="relative group/button pt-2">
                  {/* Outer glow */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-black/30 via-gray-600/30 to-black/30 rounded-[1.5rem] blur-xl opacity-40 group-hover/button:opacity-70 transition-all duration-500" />
                  
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="relative w-full h-14 bg-gradient-to-br from-black via-gray-900 to-black text-white font-semibold text-base rounded-[1.5rem] shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 border border-white/10"
                  >
                    {/* Glass shine layers */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-[1.5rem]" />
                    <div className="absolute inset-0 bg-gradient-to-tl from-white/10 via-transparent to-transparent rounded-[1.5rem]" />
                    
                    {/* Liquid shine effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover/button:translate-x-full transition-transform duration-[1200ms] ease-out bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    
                    {/* Hover glow */}
                    <div className="absolute inset-0 opacity-0 group-hover/button:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/10 via-transparent to-white/5 rounded-[1.5rem]" />
                    
                    <span className="relative flex items-center justify-center gap-2 z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Перевірка...
                        </>
                      ) : (
                        <>
                          Увійти
                          <ArrowRight className="w-5 h-5 transition-transform group-hover/button:translate-x-1 duration-300" />
                        </>
                      )}
                    </span>
                  </Button>
                </div>
              </form>

              {/* Additional info */}
              <div className="mt-7 pt-6 border-t border-gray-200/50">
                <p className="text-center text-sm text-gray-600">
                  Потрібна допомога?{" "}
                  <a
                    href="#"
                    className="text-black font-semibold hover:text-gray-700 transition-colors duration-200 relative group/link"
                  >
                    Зв'яжіться з підтримкою
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-black group-hover/link:w-full transition-all duration-300" />
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            © 2026 Платформа аналітики. Всі права захищені.
          </p>
        </div>
      </div>

      {/* iOS 18 Animations */}
      <style>{`
        @keyframes blob-slow {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          33% {
            transform: translate(40px, -40px) scale(1.1) rotate(120deg);
          }
          66% {
            transform: translate(-40px, 40px) scale(0.9) rotate(240deg);
          }
        }
        
        @keyframes float-gentle {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.6;
          }
        }
        
        .animate-blob-slow {
          animation: blob-slow 30s ease-in-out infinite;
        }
        
        .animate-float-gentle {
          animation: float-gentle 8s ease-in-out infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animation-delay-6000 {
          animation-delay: 6s;
        }
        
        .animation-delay-8000 {
          animation-delay: 8s;
        }
      `}</style>
    </div>
  );
}