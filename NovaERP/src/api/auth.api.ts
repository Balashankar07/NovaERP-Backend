import { api } from "@/lib/api-helper";
import { API_ENDPOINTS } from "@/api/endpoints";
import type { LoginRequest, LoginResponse, CurrentUser, GoogleSignInRequest, LinkGoogleRequest } from "@/types";

/**
 * Auth API service — consumes backend Authentication endpoints.
 */
export const authApi = {
  /**
   * POST /api/Auth/login
   * Authenticates user and returns JWT token.
   */
  login: (data: LoginRequest): Promise<LoginResponse> => 
    api.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, data),

  /**
   * GET /api/Auth/me
   * Returns current authenticated user info from JWT claims.
   */
  getMe: (): Promise<CurrentUser> => 
    api.get<CurrentUser>(API_ENDPOINTS.AUTH.ME),

  /**
   * POST /api/Auth/google-signin
   * Authenticates a user via a Google ID token (credential).
   * The credential is validated server-side using Google.Apis.Auth.
   * Returns the same NovaERP JWT format as email/password login.
   *
   * Security notes:
   * - Only users with a linked GoogleSubjectId are accepted.
   * - Unlinked Google accounts receive a 401 response.
   * - No new users are created automatically.
   */
  googleSignIn: (data: GoogleSignInRequest): Promise<LoginResponse> =>
    api.post<LoginResponse>(API_ENDPOINTS.AUTH.GOOGLE_SIGNIN, data),

  /**
   * POST /api/Auth/link-google
   * Links a Google account to the currently authenticated NovaERP user.
   * Requires a valid NovaERP JWT (existing session).
   *
   * Use this ONE-TIME from the Profile page:
   *   1. User logs in with email/password.
   *   2. User clicks "Connect Google Account" in profile.
   *   3. Google popup → credential obtained.
   *   4. This endpoint is called with the credential.
   *
   * Security notes:
   * - Requires existing NovaERP JWT (enforced by [Authorize] on backend).
   * - Prevents linking a Google account already mapped to another user.
   * - Idempotent — re-linking the same Google account returns success.
   */
  linkGoogle: (data: LinkGoogleRequest): Promise<{ googleEmail: string }> =>
    api.post<{ googleEmail: string }>(API_ENDPOINTS.AUTH.LINK_GOOGLE, data),

  /**
   * POST /api/Auth/change-password
   */
  changePassword: (data: any): Promise<void> =>
    api.post<void>('/Auth/change-password', data),
};
