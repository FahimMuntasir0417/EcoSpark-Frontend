import { z } from "zod";

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export const forgetPasswordInputSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordInputSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
});

export const verifyEmailInputSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(1),
});

export const refreshTokenInputSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export const changePasswordInputSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export const authUserSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    email: z.string().email(),
  })
  .passthrough();

export const authTokenPayloadSchema = z
  .object({
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
  })
  .passthrough();

export const authActionResultSchema = z.union([
  z.record(z.string(), z.unknown()),
  z.null(),
]);

export type LoginInput = z.infer<typeof loginInputSchema>;
export type RegisterInput = z.infer<typeof registerInputSchema>;
export type ForgetPasswordInput = z.infer<typeof forgetPasswordInputSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailInputSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenInputSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthTokenPayload = z.infer<typeof authTokenPayloadSchema>;
export type AuthActionResult = z.infer<typeof authActionResultSchema>;
