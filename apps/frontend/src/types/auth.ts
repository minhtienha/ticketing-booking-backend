export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  role?: string;
  status?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  accessTokenExpires?: number;
  refreshToken?: string;
  refreshTokenExpires?: number;
  user?: UserProfile;
}

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}
