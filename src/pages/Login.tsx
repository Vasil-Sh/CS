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
    // This ensures users must log in again
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("username");
  }, []); // Empty dependency array - only run once on mount

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple simultaneous login attempts
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

      // Validate user credentials (checks both admin and regular users)
      const validation = await authService.validateUser(username, password);

      if (validation.isValid) {
        // Check if user is admin
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
        
        // Navigate with replace to prevent back button issues
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
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Enhanced animated liquid background with radial fade grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Radial fade grid - sharp near center, fades to edges */}
        <div 
          className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.08)_1px,transparent_1px)] bg-[size:48px_48px]"
          style={{
            maskImage: 'radial-gradient(circle at center, black 20%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 20%, transparent 70%)'
          }}
        />
        
        {/* Large liquid blob 1 - enhanced visibility */}
        <div className="absolute top-0 left-1/4 w-[700px] h-[700px] bg-gradient-to-br from-black/15 via-gray-500/10 to-transparent rounded-full blur-3xl animate-blob" />
        
        {/* Large liquid blob 2 - enhanced visibility */}
        <div className="absolute bottom-0 right-1/4 w-[800px] h-[800px] bg-gradient-to-tl from-black/12 via-gray-400/10 to-transparent rounded-full blur-3xl animate-blob animation-delay-2000" />
        
        {/* Medium liquid blob 3 - enhanced visibility */}
        <div className="absolute top-1/3 right-1/3 w-[600px] h-[600px] bg-gradient-to-br from-gray-300/10 via-black/10 to-transparent rounded-full blur-3xl animate-blob animation-delay-4000" />
        
        {/* Additional liquid blob 4 - enhanced visibility */}
        <div className="absolute top-1/2 left-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-black/10 via-gray-400/8 to-transparent rounded-full blur-3xl animate-blob animation-delay-6000" />
        
        {/* Additional liquid blob 5 - enhanced visibility */}
        <div className="absolute bottom-1/4 left-1/4 w-[550px] h-[550px] bg-gradient-to-bl from-gray-300/10 via-black/8 to-transparent rounded-full blur-3xl animate-blob animation-delay-8000" />
        
        {/* Additional liquid blob 6 - enhanced visibility */}
        <div className="absolute top-1/4 right-1/2 w-[620px] h-[620px] bg-gradient-to-br from-black/12 via-gray-500/8 to-transparent rounded-full blur-3xl animate-blob animation-delay-10000" />
        
        {/* Extra liquid blobs for more liquid effect */}
        <div className="absolute top-1/5 left-1/5 w-[500px] h-[500px] bg-gradient-to-br from-gray-400/8 via-black/6 to-transparent rounded-full blur-3xl animate-blob animation-delay-3000" />
        <div className="absolute bottom-1/5 right-1/5 w-[580px] h-[580px] bg-gradient-to-tl from-black/10 via-gray-300/7 to-transparent rounded-full blur-3xl animate-blob animation-delay-7000" />
        <div className="absolute top-2/5 left-3/5 w-[520px] h-[520px] bg-gradient-to-tr from-gray-500/7 via-black/7 to-transparent rounded-full blur-3xl animate-blob animation-delay-9000" />
        
        {/* Floating particles - MORE particles around the form */}
        <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-black/20 rounded-full animate-float shadow-lg" />
        <div className="absolute top-2/3 right-1/4 w-4 h-4 bg-black/18 rounded-full animate-float animation-delay-1000 shadow-lg" />
        <div className="absolute bottom-1/4 left-1/2 w-3 h-3 bg-black/22 rounded-full animate-float animation-delay-2000 shadow-lg" />
        <div className="absolute top-1/2 right-1/3 w-3 h-3 bg-black/20 rounded-full animate-float animation-delay-3000 shadow-lg" />
        <div className="absolute top-1/5 left-2/3 w-3 h-3 bg-black/19 rounded-full animate-float animation-delay-4000 shadow-lg" />
        <div className="absolute bottom-1/3 right-1/2 w-4 h-4 bg-black/21 rounded-full animate-float animation-delay-5000 shadow-lg" />
        <div className="absolute top-3/4 left-1/4 w-3 h-3 bg-black/18 rounded-full animate-float animation-delay-6000 shadow-lg" />
        <div className="absolute bottom-1/2 right-1/5 w-3 h-3 bg-black/20 rounded-full animate-float animation-delay-7000 shadow-lg" />
        
        {/* Additional floating particles */}
        <div className="absolute top-1/6 left-1/2 w-2 h-2 bg-black/17 rounded-full animate-float animation-delay-8000 shadow-lg" />
        <div className="absolute top-1/3 right-1/6 w-3 h-3 bg-black/19 rounded-full animate-float animation-delay-9000 shadow-lg" />
        <div className="absolute bottom-1/5 left-1/3 w-2 h-2 bg-black/16 rounded-full animate-float animation-delay-10000 shadow-lg" />
        <div className="absolute top-2/5 left-1/5 w-4 h-4 bg-black/20 rounded-full animate-float animation-delay-11000 shadow-lg" />
        <div className="absolute bottom-2/5 right-1/4 w-2 h-2 bg-black/18 rounded-full animate-float animation-delay-12000 shadow-lg" />
        <div className="absolute top-3/5 right-2/5 w-3 h-3 bg-black/19 rounded-full animate-float animation-delay-13000 shadow-lg" />
        <div className="absolute bottom-1/6 left-2/5 w-2 h-2 bg-black/17 rounded-full animate-float animation-delay-14000 shadow-lg" />
        <div className="absolute top-4/5 right-1/3 w-3 h-3 bg-black/20 rounded-full animate-float animation-delay-15000 shadow-lg" />
        <div className="absolute bottom-2/3 left-3/5 w-2 h-2 bg-black/16 rounded-full animate-float animation-delay-16000 shadow-lg" />
        <div className="absolute top-1/8 right-2/3 w-4 h-4 bg-black/21 rounded-full animate-float animation-delay-17000 shadow-lg" />
        <div className="absolute bottom-1/8 right-3/5 w-2 h-2 bg-black/18 rounded-full animate-float animation-delay-18000 shadow-lg" />
        <div className="absolute top-5/6 left-1/6 w-3 h-3 bg-black/19 rounded-full animate-float animation-delay-19000 shadow-lg" />
        
        {/* Liquid splash circles */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 border-2 border-black/10 rounded-full animate-splash" />
        <div className="absolute bottom-1/3 right-1/3 w-40 h-40 border-2 border-black/8 rounded-full animate-splash animation-delay-3000" />
        <div className="absolute top-2/3 right-1/4 w-28 h-28 border-2 border-black/12 rounded-full animate-splash animation-delay-6000" />
      </div>

      {/* Main login container */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo/Brand section with app name */}
        <div className="text-center mb-12">
          <div className="inline-flex flex-col items-center gap-4">
            {/* Logo icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-black rounded-3xl shadow-2xl shadow-black/20 hover:scale-105 hover:rotate-3 transition-all duration-300">
              <TrendingUp className="w-10 h-10 text-white" />
            </div>
            
            {/* App name - MatchIQ */}
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-bold text-black tracking-tight">
                Match<span className="text-gray-600">IQ</span>
              </h2>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-black mb-3 tracking-tight mt-6">
            Вітаємо знову
          </h1>
          <p className="text-gray-600 text-base">
            Увійдіть до свого облікового запису
          </p>
        </div>

        {/* Login form card with enhanced glassmorphism */}
        <div className="relative group">
          {/* Enhanced glow effect on hover */}
          <div className="absolute -inset-1 bg-gradient-to-r from-black/20 via-gray-500/20 to-black/20 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-500 animate-pulse-slow" />
          
          <div className="relative bg-white/80 backdrop-blur-2xl rounded-[2rem] border-2 border-black/15 p-8 shadow-2xl">
            {/* Admin indicator */}
            {isAdmin && (
              <div className="mb-6 flex items-center justify-center gap-2 py-3 px-5 bg-black/10 backdrop-blur-sm rounded-2xl border-2 border-black/20 shadow-lg">
                <Crown className="w-5 h-5 text-black animate-pulse" />
                <span className="text-sm font-bold text-black">
                  Режим адміністратора
                </span>
              </div>
            )}

            {/* Error alert */}
            {error && (
              <Alert className="mb-6 bg-red-500/10 border-2 border-red-500/30 backdrop-blur-sm rounded-2xl shadow-lg">
                <AlertDescription className="text-red-700 text-sm font-medium">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Login form */}
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Username field */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-black/90 block tracking-wide">
                  Ім'я користувача
                </label>
                <div className="relative group/input">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 transition-colors duration-200 group-focus-within/input:text-black z-10" />
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    className={`pl-12 h-14 bg-white/50 border-2 border-black/15 rounded-2xl text-black placeholder:text-gray-500 text-base transition-all duration-300 hover:bg-white/70 hover:border-black/25 focus:bg-white/70 focus:border-black/40 focus:ring-4 focus:ring-black/10 disabled:opacity-50 shadow-lg ${
                      isAdmin ? "blur-sm focus:blur-none" : ""
                    }`}
                    placeholder="Введіть ім'я користувача"
                  />
                  {/* Enhanced input glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-black/0 via-black/10 to-black/0 opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-black/90 block tracking-wide">
                  Пароль
                </label>
                <div className="relative group/input">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 transition-colors duration-200 group-focus-within/input:text-black z-10" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pl-12 h-14 bg-white/50 border-2 border-black/15 rounded-2xl text-black placeholder:text-gray-500 text-base transition-all duration-300 hover:bg-white/70 hover:border-black/25 focus:bg-white/70 focus:border-black/40 focus:ring-4 focus:ring-black/10 disabled:opacity-50 shadow-lg"
                    placeholder="Введіть пароль"
                  />
                  {/* Enhanced input glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-black/0 via-black/10 to-black/0 opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              </div>

              {/* Submit button with LIQUID STYLE */}
              <div className="relative group/button">
                {/* Multiple layer glow effects for liquid look */}
                <div className="absolute -inset-1 bg-gradient-to-r from-black/30 via-gray-600/30 to-black/30 rounded-3xl blur-xl opacity-40 group-hover/button:opacity-80 transition duration-500" />
                <div className="absolute -inset-2 bg-gradient-to-r from-transparent via-black/20 to-transparent rounded-3xl blur-2xl opacity-0 group-hover/button:opacity-100 transition duration-700 animate-pulse-slow" />
                
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="relative w-full h-14 bg-gradient-to-r from-black via-gray-800 to-black hover:from-gray-900 hover:via-black hover:to-gray-900 text-white font-bold text-base rounded-3xl shadow-2xl shadow-black/40 transition-all duration-500 hover:scale-[1.03] active:scale-[0.97] overflow-hidden group/btn disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 border-2 border-black/20"
                >
                  {/* Liquid shine effect - multiple layers */}
                  <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1200 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  <div className="absolute inset-0 translate-x-full group-hover/btn:-translate-x-full transition-transform duration-1500 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  
                  {/* Liquid ripple effect - multiple ripples */}
                  <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 group-hover/btn:w-full group-hover/btn:h-full bg-white/10 rounded-full transition-all duration-700" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 group-hover/btn:w-[120%] group-hover/btn:h-[120%] bg-white/5 rounded-full transition-all duration-1000 delay-100" />
                  </div>
                  
                  {/* Liquid bubble effect on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300">
                    <div className="absolute top-2 left-4 w-2 h-2 bg-white/30 rounded-full animate-float" />
                    <div className="absolute bottom-3 right-6 w-3 h-3 bg-white/20 rounded-full animate-float animation-delay-1000" />
                    <div className="absolute top-1/2 right-4 w-2 h-2 bg-white/25 rounded-full animate-float animation-delay-2000" />
                  </div>
                  
                  {/* Glossy liquid overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/20 rounded-3xl pointer-events-none" />
                  
                  <span className="relative flex items-center justify-center gap-2 z-10">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Перевірка...
                      </>
                    ) : (
                      <>
                        Увійти
                        <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1 duration-300" />
                      </>
                    )}
                  </span>
                </Button>
              </div>
            </form>

            {/* Additional info */}
            <div className="mt-8 pt-6 border-t-2 border-black/10">
              <p className="text-center text-sm text-gray-600">
                Потрібна допомога?{" "}
                <a
                  href="#"
                  className="text-black font-bold hover:text-gray-700 transition-colors duration-200 relative group/link"
                >
                  Зв'яжіться з підтримкою
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-black group-hover/link:w-full transition-all duration-300" />
                </a>
              </p>
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

      {/* Enhanced animations */}
      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          25% {
            transform: translate(30px, -60px) scale(1.15) rotate(90deg);
          }
          50% {
            transform: translate(-30px, 30px) scale(0.85) rotate(180deg);
          }
          75% {
            transform: translate(60px, 60px) scale(1.1) rotate(270deg);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px) scale(1);
            opacity: 0.4;
          }
          25% {
            transform: translateY(-30px) translateX(15px) scale(1.1);
            opacity: 0.7;
          }
          50% {
            transform: translateY(-60px) translateX(-15px) scale(1.2);
            opacity: 1;
          }
          75% {
            transform: translateY(-30px) translateX(10px) scale(1.1);
            opacity: 0.6;
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
        }
        
        @keyframes splash {
          0% {
            transform: scale(0);
            opacity: 0.8;
          }
          100% {
            transform: scale(3);
            opacity: 0;
          }
        }
        
        .animate-blob {
          animation: blob 25s ease-in-out infinite;
        }
        
        .animate-float {
          animation: float 10s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        
        .animate-splash {
          animation: splash 4s ease-out infinite;
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
        
        .animation-delay-5000 {
          animation-delay: 5s;
        }
        
        .animation-delay-6000 {
          animation-delay: 6s;
        }
        
        .animation-delay-7000 {
          animation-delay: 7s;
        }
        
        .animation-delay-8000 {
          animation-delay: 8s;
        }
        
        .animation-delay-9000 {
          animation-delay: 9s;
        }
        
        .animation-delay-10000 {
          animation-delay: 10s;
        }
        
        .animation-delay-11000 {
          animation-delay: 11s;
        }
        
        .animation-delay-12000 {
          animation-delay: 12s;
        }
        
        .animation-delay-13000 {
          animation-delay: 13s;
        }
        
        .animation-delay-14000 {
          animation-delay: 14s;
        }
        
        .animation-delay-15000 {
          animation-delay: 15s;
        }
        
        .animation-delay-16000 {
          animation-delay: 16s;
        }
        
        .animation-delay-17000 {
          animation-delay: 17s;
        }
        
        .animation-delay-18000 {
          animation-delay: 18s;
        }
        
        .animation-delay-19000 {
          animation-delay: 19s;
        }
      `}</style>
    </div>
  );
}