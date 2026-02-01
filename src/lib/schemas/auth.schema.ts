import { z } from 'zod';

// Email schema
export const emailSchema = z
  .string()
  .email('Wprowadź prawidłowy adres email')
  .min(1, 'Email jest wymagany');

// Password schema (logowanie)
export const loginPasswordSchema = z
  .string()
  .min(6, 'Hasło musi mieć minimum 6 znaków');

// Password schema (rejestracja/reset)
export const passwordSchema = z
  .string()
  .min(8, 'Hasło musi mieć minimum 8 znaków')
  .regex(/[A-Z]/, 'Hasło musi zawierać przynajmniej jedną wielką literę')
  .regex(/[0-9]/, 'Hasło musi zawierać przynajmniej jedną cyfrę')
  .regex(
    /[^A-Za-z0-9]/,
    'Hasło musi zawierać przynajmniej jeden znak specjalny'
  );

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

// Register schema
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Hasła nie są identyczne',
    path: ['confirmPassword'],
  });

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Reset password schema
export const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Hasła nie są identyczne',
    path: ['confirmNewPassword'],
  });

// Type exports for use in components
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
