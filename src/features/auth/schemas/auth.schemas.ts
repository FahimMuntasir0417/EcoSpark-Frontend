import { z } from "zod";

const nameSchema = z.string().trim().min(1, "Name is required.");
const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Please enter a valid email address.");
const otpSchema = z.string().trim().min(1, "OTP is required.");
const loginPasswordSchema = z.string().min(1, "Password is required.");
const securePasswordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters.");
const tokenSchema = z.string().trim().min(1, "Token is required.");

export const authFieldSchemas = {
  name: nameSchema,
  email: emailSchema,
  otp: otpSchema,
  loginPassword: loginPasswordSchema,
  securePassword: securePasswordSchema,
  token: tokenSchema,
} as const;

export const registerFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: securePasswordSchema,
});

export const loginFormSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

export const forgotPasswordFormSchema = z.object({
  email: emailSchema,
});

export const resetPasswordFormSchema = z.object({
  token: tokenSchema,
  password: securePasswordSchema,
});

export const verifyEmailFormSchema = z.object({
  otp: otpSchema,
});

export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;
export type VerifyEmailFormValues = z.infer<typeof verifyEmailFormSchema>;
