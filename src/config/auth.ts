export const AUTH_COOKIE_KEYS = {
  accessToken: "eco_spark_access_token",
  refreshToken: "eco_spark_refresh_token",
  userRole: "eco_spark_user_role",
} as const;

export const AUTH_STORAGE_KEYS = {
  accessToken: "eco_spark_access_token",
  refreshToken: "eco_spark_refresh_token",
  userRole: "eco_spark_user_role",
} as const;

export const FALLBACK_TOKEN_COOKIE_KEYS = ["accessToken", "token"] as const;
export const FALLBACK_REFRESH_COOKIE_KEYS = ["refreshToken"] as const;
export const FALLBACK_ROLE_COOKIE_KEYS = ["role", "userRole"] as const;
