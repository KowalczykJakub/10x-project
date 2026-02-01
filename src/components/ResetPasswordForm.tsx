import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabaseBrowser } from '@/db/supabase-browser';

export default function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    newPassword?: string;
    confirmNewPassword?: string;
  }>({});

  useEffect(() => {
    // Check if user has a valid session from the reset password link
    const checkToken = async () => {
      try {
        const { data: { session }, error } = await supabaseBrowser.auth.getSession();
        
        if (error || !session) {
          setTokenValid(false);
          setError('Link resetujący wygasł lub jest nieprawidłowy');
        } else {
          setTokenValid(true);
        }
      } catch {
        setTokenValid(false);
        setError('Link resetujący wygasł lub jest nieprawidłowy');
      }
    };

    checkToken();
  }, []);

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

    if (!newPassword) {
      errors.newPassword = 'Hasło jest wymagane';
    } else {
      const passwordErrors = validatePassword(newPassword);
      if (passwordErrors.length > 0) {
        errors.newPassword = passwordErrors[0]; // Show first error
      }
    }

    if (!confirmNewPassword) {
      errors.confirmNewPassword = 'Potwierdzenie hasła jest wymagane';
    } else if (newPassword !== confirmNewPassword) {
      errors.confirmNewPassword = 'Hasła nie są identyczne';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Call reset password API endpoint
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword, confirmNewPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors from backend
        if (data.details) {
          setFieldErrors(data.details);
        }
        throw new Error(data.message || 'Wystąpił błąd podczas zmiany hasła');
      }

      // Success
      setSuccess(true);
      toast.success('Hasło zostało zmienione pomyślnie!');
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

  // Loading state while checking token
  if (tokenValid === null) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
          <p className="text-sm text-muted-foreground">Weryfikacja linku...</p>
        </CardContent>
      </Card>
    );
  }

  // Invalid token
  if (tokenValid === false) {
    return (
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Link wygasł</CardTitle>
          <CardDescription>
            Link resetujący jest nieprawidłowy lub wygasł
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
            role="alert"
          >
            {error}
          </div>
          <Button
            asChild
            className="w-full"
            size="lg"
          >
            <a href="/forgot-password">Wyślij nowy link</a>
          </Button>
          <div className="text-center">
            <a
              href="/login"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Wróć do logowania
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success state
  if (success) {
    return (
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Hasło zostało zmienione</CardTitle>
          <CardDescription>
            Możesz się teraz zalogować używając nowego hasła
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="p-4 text-sm text-green-800 bg-green-50 border border-green-200 rounded-md"
            role="alert"
          >
            <p className="font-medium mb-1">Hasło zostało pomyślnie zmienione!</p>
            <p>
              Możesz się teraz zalogować do swojego konta używając nowego hasła.
            </p>
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
        <CardTitle className="text-2xl font-bold">Ustaw nowe hasło</CardTitle>
        <CardDescription>
          Wprowadź nowe hasło dla swojego konta
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

          {/* New Password Field */}
          <div className="space-y-2">
            <label htmlFor="newPassword" className="text-sm font-medium leading-none">
              Nowe hasło
            </label>
            <Input
              id="newPassword"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              aria-invalid={!!fieldErrors.newPassword}
              aria-describedby={fieldErrors.newPassword ? "new-password-error password-help" : "password-help"}
            />
            <p id="password-help" className="text-xs text-muted-foreground">
              Min. 8 znaków, wielka litera, cyfra i znak specjalny
            </p>
            {fieldErrors.newPassword && (
              <p id="new-password-error" className="text-sm text-destructive">
                {fieldErrors.newPassword}
              </p>
            )}
          </div>

          {/* Confirm New Password Field */}
          <div className="space-y-2">
            <label htmlFor="confirmNewPassword" className="text-sm font-medium leading-none">
              Potwierdź nowe hasło
            </label>
            <Input
              id="confirmNewPassword"
              type="password"
              placeholder="••••••••"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              disabled={loading}
              aria-invalid={!!fieldErrors.confirmNewPassword}
              aria-describedby={fieldErrors.confirmNewPassword ? "confirm-new-password-error" : undefined}
            />
            {fieldErrors.confirmNewPassword && (
              <p id="confirm-new-password-error" className="text-sm text-destructive">
                {fieldErrors.confirmNewPassword}
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
            {loading ? 'Ustawianie hasła...' : 'Ustaw nowe hasło'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
