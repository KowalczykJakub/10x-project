/**
 * Maps Supabase Auth error codes to user-friendly Polish messages
 * @param error - Error object from Supabase Auth
 * @returns User-friendly error message in Polish
 */
export function getAuthErrorMessage(error: unknown): string {
  const errorObj = error as { code?: string; error_code?: string; message?: string };
  const errorCode = errorObj?.code || errorObj?.error_code;
  const errorMessage = errorObj?.message || "";

  // Mapowanie kodów błędów Supabase Auth
  const errorMap: Record<string, string> = {
    invalid_credentials: "Nieprawidłowy email lub hasło",
    email_exists: "Email jest już zarejestrowany",
    user_already_exists: "Email jest już zarejestrowany",
    email_not_confirmed: "Konto nie zostało zweryfikowane. Sprawdź swoją skrzynkę email.",
    user_not_found: "Nie znaleziono użytkownika",
    invalid_grant: "Link resetujący wygasł lub jest nieprawidłowy",
    weak_password: "Hasło jest zbyt słabe",
    over_email_send_rate_limit: "Zbyt wiele prób. Spróbuj ponownie później.",
    email_address_invalid: "Nieprawidłowy adres email",
    validation_failed: "Nieprawidłowe dane. Sprawdź formularz.",
  };

  // Sprawdź czy mamy mapowanie dla tego kodu
  if (errorCode && errorMap[errorCode]) {
    return errorMap[errorCode];
  }

  // Sprawdź czy message zawiera znane frazy
  const lowerMessage = errorMessage.toLowerCase();
  if (lowerMessage.includes("invalid login credentials")) {
    return "Nieprawidłowy email lub hasło";
  }
  if (lowerMessage.includes("email not confirmed")) {
    return "Konto nie zostało zweryfikowane. Sprawdź swoją skrzynkę email.";
  }
  if (lowerMessage.includes("user already registered")) {
    return "Email jest już zarejestrowany";
  }

  // Domyślny komunikat
  return "Wystąpił błąd. Spróbuj ponownie.";
}
