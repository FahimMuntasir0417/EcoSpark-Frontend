import { httpClient } from "@/lib/axios/httpClient";
import { parseApiData, parseApiPayload } from "@/lib/api/parse";
import {
  authActionResultSchema,
  authTokenPayloadSchema,
  changePasswordInputSchema,
  forgetPasswordInputSchema,
  loginInputSchema,
  refreshTokenInputSchema,
  registerInputSchema,
  resetPasswordInputSchema,
  verifyEmailInputSchema,
} from "@/contracts/auth.contract";
import type {
  AuthActionResult,
  AuthTokenPayload,
  ChangePasswordInput,
  ForgetPasswordInput,
  LoginInput,
  RefreshTokenInput,
  RegisterInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from "@/contracts/auth.contract";

export type {
  AuthActionResult,
  AuthTokenPayload,
  ChangePasswordInput,
  ForgetPasswordInput,
  LoginInput,
  RefreshTokenInput,
  RegisterInput,
  ResetPasswordInput,
  VerifyEmailInput,
};

export const authService = {
  async register(payload: RegisterInput) {
    const parsedPayload = parseApiPayload(payload, registerInputSchema);
    const response = await httpClient.post<unknown>("/auth/register", parsedPayload);
    return parseApiData(response, authActionResultSchema);
  },

  async login(payload: LoginInput) {
    const parsedPayload = parseApiPayload(payload, loginInputSchema);
    const response = await httpClient.post<unknown>("/auth/login", parsedPayload);
    return parseApiData(response, authActionResultSchema);
  },

  async refreshToken(payload: RefreshTokenInput = {}) {
    const parsedPayload = parseApiPayload(payload, refreshTokenInputSchema);
    const response = await httpClient.post<unknown>("/auth/refresh-token", parsedPayload);
    return parseApiData(response, authTokenPayloadSchema);
  },

  async changePassword(payload: ChangePasswordInput) {
    const parsedPayload = parseApiPayload(payload, changePasswordInputSchema);
    const response = await httpClient.post<unknown>("/auth/change-password", parsedPayload);
    return parseApiData(response, authActionResultSchema);
  },

  async logout() {
    const response = await httpClient.post<unknown>("/auth/logout");
    return parseApiData(response, authActionResultSchema);
  },

  async verifyEmail(payload: VerifyEmailInput) {
    const parsedPayload = parseApiPayload(payload, verifyEmailInputSchema);
    const response = await httpClient.post<unknown>("/auth/verify-email", parsedPayload);
    return parseApiData(response, authActionResultSchema);
  },

  async forgetPassword(payload: ForgetPasswordInput) {
    const parsedPayload = parseApiPayload(payload, forgetPasswordInputSchema);
    const response = await httpClient.post<unknown>("/auth/forget-password", parsedPayload);
    return parseApiData(response, authActionResultSchema);
  },

  async forgotPassword(payload: ForgetPasswordInput) {
    return this.forgetPassword(payload);
  },

  async resetPassword(payload: ResetPasswordInput) {
    const parsedPayload = parseApiPayload(payload, resetPasswordInputSchema);
    const response = await httpClient.post<unknown>("/auth/reset-password", parsedPayload);
    return parseApiData(response, authActionResultSchema);
  },

  async getGoogleLogin() {
    const response = await httpClient.get<unknown>("/auth/login/google");
    return parseApiData(response, authActionResultSchema);
  },

  async getGoogleLoginSuccess() {
    const response = await httpClient.get<unknown>("/auth/google/success");
    return parseApiData(response, authActionResultSchema);
  },

  async getOAuthError() {
    const response = await httpClient.get<unknown>("/auth/oauth/error");
    return parseApiData(response, authActionResultSchema);
  },
};
