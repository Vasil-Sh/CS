import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { authService } from '@/lib/authService';
import { Loader2, LogIn, TrendingUp } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check if current input looks like admin credentials
  const isAdminInput = username.toLowerCase() === 'admin' || username.toLowerCase() === 'super_gus23_7482';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await authService.login(username, password);
      if (result.success) {
        navigate('/analytics');
      } else {
        setError(result.error || 'Невірний логін або пароль');
      }
    } catch (err) {
      setError('Помилка входу. Спробуйте ще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#FAFAF8]">
      {/* Decorative elements with hatching pattern */}
      <div className="absolute top-16 right-16 w-40 h-40 rounded-[40px] bg-[#E8E6DC] opacity-30" 
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)`
        }} 
      />
      <div className="absolute bottom-24 left-16 w-32 h-32 rounded-[36px] bg-[#D4D2C8] opacity-25"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)`
        }}
      />
      
      {/* Subtle grid pattern overlay */}
      <svg className="absolute top-0 left-0 w-full h-full opacity-[0.015] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" patternUnits="userSpaceOnUse" width="40" height="40">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#000000" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <Card className={`w-full max-w-lg bg-white/95 border-[#E8E6DC] shadow-[0_12px_48px_rgba(0,0,0,0.06)] rounded-[40px] transition-all duration-300 ${
          isAdminInput ? 'ring-2 ring-[#F4E157] shadow-[0_12px_48px_rgba(244,225,87,0.12)]' : ''
        }`}>
          <div className="p-14 space-y-10">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-28 h-28 rounded-[36px] mb-6 transition-all duration-300 bg-[#F4E157] shadow-[0_8px_24px_rgba(244,225,87,0.25)]">
                <TrendingUp className="w-14 h-14 text-black" strokeWidth={1.5} />
              </div>
              <h1 className="text-6xl font-light text-black tracking-tight leading-tight">
                MatchIQ
              </h1>
              <h2 className={`text-3xl font-light transition-colors duration-300 leading-tight ${
                isAdminInput ? 'text-[#6B6B6B]' : 'text-[#2A2A2A]'
              }`}>
                {isAdminInput ? 'Вхід адміністратора' : 'Вітаємо знову'}
              </h2>
              <p className="text-[#8B8B8B] text-base font-light pt-2">
                Увійдіть до свого облікового запису
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-7">
              <div className="space-y-3">
                <Label htmlFor="username" className="text-[#2A2A2A] font-normal text-base">
                  Ім'я користувача
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Введіть ім'я користувача"
                  required
                  disabled={isLoading}
                  className={`h-16 bg-[#FAFAF8] border-[#E8E6DC] rounded-[24px] text-[#2A2A2A] placeholder:text-[#ABABAB] transition-all duration-200 text-lg font-light ${
                    isAdminInput 
                      ? 'focus:border-[#F4E157] focus:ring-[#F4E157] focus:ring-2' 
                      : 'focus:border-[#D4D2C8] focus:ring-[#D4D2C8] focus:ring-2'
                  }`}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="password" className="text-[#2A2A2A] font-normal text-base">
                  Пароль
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введіть пароль"
                  required
                  disabled={isLoading}
                  className={`h-16 bg-[#FAFAF8] border-[#E8E6DC] rounded-[24px] text-[#2A2A2A] placeholder:text-[#ABABAB] transition-all duration-200 text-lg font-light ${
                    isAdminInput 
                      ? 'focus:border-[#F4E157] focus:ring-[#F4E157] focus:ring-2' 
                      : 'focus:border-[#D4D2C8] focus:ring-[#D4D2C8] focus:ring-2'
                  }`}
                />
              </div>

              {error && (
                <div className="p-5 rounded-[24px] bg-[#FFE8E8] border border-[#FFCCCC]">
                  <p className="text-base text-[#D32F2F] text-center font-normal">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-16 text-black font-normal rounded-[24px] transition-all duration-200 transform hover:scale-[1.01] text-lg mt-8 bg-[#F4E157] hover:bg-[#E8D54B] shadow-[0_6px_20px_rgba(244,225,87,0.25)] hover:shadow-[0_8px_28px_rgba(244,225,87,0.35)]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" strokeWidth={1.5} />
                    Вхід...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-3 h-6 w-6" strokeWidth={1.5} />
                    Увійти
                  </>
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="text-center space-y-3 pt-4">
              <p className="text-base text-[#8B8B8B] font-light">
                Потрібна допомога? <a href="#" className="text-[#2A2A2A] font-normal hover:underline transition-colors">Зв'яжіться з підтримкою</a>
              </p>
              <p className="text-sm text-[#ABABAB] pt-6 border-t border-[#E8E6DC] font-light">
                © 2026 Платформа аналітики. Всі права захищені.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom decorative element with hatching */}
      <div className={`absolute bottom-12 right-12 w-48 h-48 rounded-[40px] opacity-15 transition-all duration-300 ${
        isAdminInput ? 'bg-[#F4E157]' : 'bg-[#E8E6DC]'
      }`} style={{
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.05) 4px, rgba(0,0,0,0.05) 5px)`
      }} />
    </div>
  );
}