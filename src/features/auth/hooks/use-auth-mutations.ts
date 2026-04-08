import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  authService,
  type ChangePasswordInput,
  type ForgetPasswordInput,
  type LoginInput,
  type RefreshTokenInput,
  type RegisterInput,
  type ResetPasswordInput,
  type VerifyEmailInput,
} from "@/services/auth.service";
import { authQueryKeys } from "./use-auth-queries";

export function useRegisterMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegisterInput) => authService.register(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authQueryKeys.all });
    },
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginInput) => authService.login(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authQueryKeys.all });
    },
  });
}

export function useRefreshTokenMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload?: RefreshTokenInput) => authService.refreshToken(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authQueryKeys.all });
    },
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (payload: ChangePasswordInput) => authService.changePassword(payload),
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authQueryKeys.all });
    },
  });
}

export function useVerifyEmailMutation() {
  return useMutation({
    mutationFn: (payload: VerifyEmailInput) => authService.verifyEmail(payload),
  });
}

export function useForgetPasswordMutation() {
  return useMutation({
    mutationFn: (payload: ForgetPasswordInput) => authService.forgetPassword(payload),
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (payload: ResetPasswordInput) => authService.resetPassword(payload),
  });
}

export function useGoogleLoginMutation() {
  return useMutation({
    mutationFn: () => authService.getGoogleLogin(),
  });
}