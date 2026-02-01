import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [requiresConfirmation, setRequiresConfirmation] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Hasło musi mieć minimum 8 znaków');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Hasło musi zawierać przynajmniej jedną wielką literę');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Hasło musi zawierać przynajmniej jedną cyfrę');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Hasło musi zawierać przynajmniej jeden znak specjalny');
    }

    return errors;
  };

  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};

    if (!email) {
      errors.email = 'Email jest wymagany';
    } else if (!validateEmail(email)) {
      errors.email = 'Wprowadź prawidłowy adres email';
    }

    if (!password) {
      errors.password = 'Hasło jest wymagane';
    } else {
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        errors.password = passwordErrors[0]; // Show first error
      }
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Potwierdzenie hasła jest wymagane';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Hasła nie są identyczne';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Call register API endpoint
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors from backend
        if (data.details) {
          setFieldErrors(data.details);
        }
        throw new Error(data.message || 'Wystąpił błąd podczas rejestracji');
      }

      // Success
      setSuccess(true);
      setRequiresConfirmation(data.requiresConfirmation);
      
      if (data.requiresConfirmation) {
        toast.info('Sprawdź swoją skrzynkę email, aby zweryfikować konto');
      } else {
        toast.success('Konto zostało utworzone! Możesz się teraz zalogować.');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        toast.error(err.message);
      } else {
        const errorMsg = 'Wystąpił błąd. Spróbuj ponownie.';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            {requiresConfirmation ? 'Sprawdź swoją skrzynkę email' : 'Konto utworzone!'}
          </CardTitle>
          <CardDescription>
            Konto zostało utworzone pomyślnie
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="p-4 text-sm text-green-800 bg-green-50 border border-green-200 rounded-md"
            role="alert"
          >
            <p className="font-medium mb-1">Konto zostało utworzone!</p>
            {requiresConfirmation ? (
              <p>
                Sprawdź swoją skrzynkę email, aby zweryfikować adres. Po weryfikacji będziesz mógł się zalogować.
              </p>
            ) : (
              <p>
                Możesz się teraz zalogować i zacząć korzystać z aplikacji. Zalecamy weryfikację adresu email.
              </p>
            )}
          </div>
          <Button
            asChild
            className="w-full"
            size="lg"
          >
            <a href="/login">Przejdź do logowania</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Utwórz konto</CardTitle>
        <CardDescription>
          Wprowadź swoje dane, aby założyć nowe konto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Global Error */}
          {error && (
            <div
              className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium leading-none">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="twoj@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
            />
            {fieldErrors.email && (
              <p id="email-error" className="text-sm text-destructive">
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium leading-none">
              Hasło
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? "password-error password-help" : "password-help"}
            />
            <p id="password-help" className="text-xs text-muted-foreground">
              Min. 8 znaków, wielka litera, cyfra i znak specjalny
            </p>
            {fieldErrors.password && (
              <p id="password-error" className="text-sm text-destructive">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium leading-none">
              Potwierdź hasło
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              aria-invalid={!!fieldErrors.confirmPassword}
              aria-describedby={fieldErrors.confirmPassword ? "confirm-password-error" : undefined}
            />
            {fieldErrors.confirmPassword && (
              <p id="confirm-password-error" className="text-sm text-destructive">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading}
          >
            {loading ? 'Tworzenie konta...' : 'Zarejestruj się'}
          </Button>

          {/* Login Link */}
          <div className="text-center text-sm text-muted-foreground">
            Masz już konto?{' '}
            <a href="/login" className="text-primary hover:underline font-medium">
              Zaloguj się
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
