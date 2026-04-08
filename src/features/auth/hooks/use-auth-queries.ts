import { queryOptions, useQuery } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";

export const authQueryKeys = {
  all: ["auth"] as const,
  google: () => [...authQueryKeys.all, "google"] as const,
  googleSuccess: () => [...authQueryKeys.google(), "success"] as const,
  oauthError: () => [...authQueryKeys.all, "oauth", "error"] as const,
};

export function getGoogleLoginSuccessQueryOptions() {
  return queryOptions({
    queryKey: authQueryKeys.googleSuccess(),
    queryFn: () => authService.getGoogleLoginSuccess(),
  });
}

export function getOAuthErrorQueryOptions() {
  return queryOptions({
    queryKey: authQueryKeys.oauthError(),
    queryFn: () => authService.getOAuthError(),
  });
}

export function useGoogleLoginSuccessQuery() {
  return useQuery(getGoogleLoginSuccessQueryOptions());
}

export function useOAuthErrorQuery() {
  return useQuery(getOAuthErrorQueryOptions());
}