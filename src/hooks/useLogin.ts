import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface UseLoginReturn {
  username: string;
  setUsername: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  isLoading: boolean;
  error: string;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

/**
 * Shared login logic for Login.tsx and LoginDigestoDemo.tsx.
 * Eliminates duplicate auth logic between the two login pages.
 */
export function useLogin(): UseLoginReturn {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(username, password);
      if (result.success) {
        navigate('/app/analytics');
      } else {
        setError(result.error || 'Невірний логін або пароль');
      }
    } catch {
      setError('Помилка входу. Спробуйте ще раз.');
    } finally {
      setIsLoading(false);
    }
  }, [username, password, login, navigate]);

  return {
    username,
    setUsername,
    password,
    setPassword,
    isLoading,
    error,
    handleSubmit,
  };
}
