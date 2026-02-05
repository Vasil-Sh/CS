import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { authService } from '@/lib/authService';
import { Loader2, LogIn, TrendingUp, Crown } from 'lucide-react';

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
    <div className="min-h-screen relative overflow-hidden bg-[#F9F8F3]">
      {/* Decorative elements */}
      <div className="absolute top-20 right-20 w-32 h-32 rounded-[32px] bg-[#E8E6DC] opacity-40" />
      <div className="absolute bottom-20 left-20 w-24 h-24 rounded-[28px] bg-[#D4D2C8] opacity-30" />
      
      {/* Hatching pattern overlay */}
      <svg className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="diagonalHatch" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#000000" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#diagonalHatch)" />
      </svg>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <Card className={`w-full max-w-md bg-white/90 border-[#E8E6DC] shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-[32px] transition-all duration-300 ${
          isAdminInput ? 'ring-2 ring-[#D4AF37] shadow-[0_8px_32px_rgba(212,175,55,0.15)]' : ''
        }`}>
          <div className="p-12 space-y-8">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-[28px] mb-4 transition-all duration-300 ${
                isAdminInput 
                  ? 'bg-gradient-to-br from-[#D4AF37] to-[#F4E4A6] shadow-[0_4px_16px_rgba(212,175,55,0.4)]' 
                  : 'bg-[#E8D98F] shadow-[0_4px_16px_rgba(232,217,143,0.3)]'
              }`}>
                {isAdminInput ? (
                  <Crown className="w-10 h-10 text-white" strokeWidth={2.5} />
                ) : (
                  <TrendingUp className="w-10 h-10 text-black" strokeWidth={2.5} />
                )}
              </div>
              <h1 className="text-4xl font-bold text-black tracking-tight">
                MatchIQ
              </h1>
              <h2 className={`text-2xl font-semibold transition-colors duration-300 ${
                isAdminInput ? 'text-[#D4AF37]' : 'text-black'
              }`}>
                {isAdminInput ? 'Вхід адміністратора' : 'Вітаємо знову'}
              </h2>
              <p className="text-[#6B6B6B] text-sm font-medium">
                Увійдіть до свого облікового запису
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="username" className="text-black font-semibold text-sm">
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
                  className={`h-14 bg-[#F9F8F3] border-[#E8E6DC] rounded-[20px] text-black placeholder:text-[#9B9B9B] transition-all duration-200 text-base ${
                    isAdminInput 
                      ? 'focus:border-[#D4AF37] focus:ring-[#D4AF37] focus:ring-2' 
                      : 'focus:border-[#E8D98F] focus:ring-[#E8D98F] focus:ring-2'
                  }`}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="password" className="text-black font-semibold text-sm">
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
                  className={`h-14 bg-[#F9F8F3] border-[#E8E6DC] rounded-[20px] text-black placeholder:text-[#9B9B9B] transition-all duration-200 text-base ${
                    isAdminInput 
                      ? 'focus:border-[#D4AF37] focus:ring-[#D4AF37] focus:ring-2' 
                      : 'focus:border-[#E8D98F] focus:ring-[#E8D98F] focus:ring-2'
                  }`}
                />
              </div>

              {error && (
                <div className="p-4 rounded-[20px] bg-[#FFE5E5] border border-[#FFB8B8]">
                  <p className="text-sm text-[#D32F2F] text-center font-medium">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className={`w-full h-14 text-black font-bold rounded-[20px] transition-all duration-200 transform hover:scale-[1.02] text-base ${
                  isAdminInput
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#F4E4A6] hover:from-[#C49F2F] hover:to-[#E8D98F] shadow-[0_4px_16px_rgba(212,175,55,0.3)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.4)]'
                    : 'bg-[#E8D98F] hover:bg-[#DCC97F] shadow-[0_4px_16px_rgba(232,217,143,0.3)] hover:shadow-[0_6px_20px_rgba(232,217,143,0.4)]'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Вхід...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    Увійти
                  </>
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="text-center space-y-2">
              <p className="text-sm text-[#6B6B6B]">
                Потрібна допомога? <a href="#" className="text-black font-semibold hover:underline">Зв'яжіться з підтримкою</a>
              </p>
              <p className="text-xs text-[#9B9B9B] pt-4 border-t border-[#E8E6DC]">
                © 2026 Платформа аналітики. Всі права захищені.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom decorative element with hatching */}
      <div className={`absolute bottom-10 right-10 w-40 h-40 rounded-[32px] opacity-20 transition-all duration-300 ${
        isAdminInput ? 'bg-[#D4AF37]' : 'bg-[#E8D98F]'
      }`} style={{
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.1) 4px, rgba(0,0,0,0.1) 5px)`
      }} />
    </div>
  );
}