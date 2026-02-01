import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
  }>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};

    if (!email) {
      errors.email = 'Email jest wymagany';
    } else if (!validateEmail(email)) {
      errors.email = 'Wprowadź prawidłowy adres email';
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
      // Call forgot password API endpoint
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors from backend
        if (data.details) {
          setFieldErrors(data.details);
        }
        throw new Error(data.message || 'Wystąpił błąd podczas wysyłania linku');
      }

      // Success
      setSuccess(true);
      toast.success('Link do resetowania hasła został wysłany');
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
          <CardTitle className="text-2xl font-bold">Sprawdź swoją skrzynkę email</CardTitle>
          <CardDescription>
            Link został wysłany pomyślnie
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="p-4 text-sm text-green-800 bg-green-50 border border-green-200 rounded-md"
            role="alert"
          >
            <p className="font-medium mb-1">Link do resetowania hasła został wysłany!</p>
            <p>
              Sprawdź swoją skrzynkę email na adres <strong>{email}</strong>. Kliknij w link, aby ustawić nowe hasło.
            </p>
            <p className="mt-2 text-xs">
              Link pozostanie aktywny przez 1 godzinę.
            </p>
          </div>
          <Button
            asChild
            className="w-full"
            size="lg"
          >
            <a href="/login">Wróć do logowania</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Zresetuj hasło</CardTitle>
        <CardDescription>
          Wprowadź swój adres email, a wyślemy Ci link do zresetowania hasła
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

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading}
          >
            {loading ? 'Wysyłanie...' : 'Wyślij link resetujący'}
          </Button>

          {/* Back to Login Link */}
          <div className="text-center">
            <a
              href="/login"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              ← Wróć do logowania
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
