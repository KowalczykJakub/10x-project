import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client.ts";

// Ścieżki chronione - wymagają uwierzytelnienia
const PROTECTED_ROUTES = [
  "/generate",
  "/flashcards",
  "/study",
  "/history",
  "/profile",
  "/api/flashcards",
  "/api/generations",
];

// Ścieżki publiczne - dostępne bez uwierzytelnienia (reserved for future use)
// const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password", "/api/auth"];

export const onRequest = defineMiddleware(async (context, next) => {
  const { cookies, url, request, redirect, locals } = context;

  // Tworzymy Supabase Server Client (SSR-friendly)
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Zapisz klienta w locals (dostępny w całej aplikacji)
  locals.supabase = supabase;

  // Pobierz sesję użytkownika
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Zapisz użytkownika i sesję w locals
  locals.user = user ?? null;

  // Pobierz pełną sesję jeśli użytkownik istnieje
  if (user) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    locals.session = session;
  } else {
    locals.session = null;
  }

  const pathname = url.pathname;

  // Sprawdź czy ścieżka jest chroniona
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  // Jeśli chroniona ścieżka i brak użytkownika -> przekieruj do /login
  if (isProtectedRoute && !user) {
    return redirect("/login");
  }

  // Jeśli użytkownik zalogowany próbuje wejść na /login lub /register -> przekieruj do /generate
  if (user && (pathname === "/login" || pathname === "/register")) {
    return redirect("/generate");
  }

  // Kontynuuj przetwarzanie requestu
  const response = await next();

  return response;
});
