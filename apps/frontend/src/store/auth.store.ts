import { create } from 'zustand';
import { authService } from '../services/auth.service';
import { AuthState, LoginPayload, RegisterPayload } from '../types/auth';

export const useAuthStore = create<AuthState>((set) => ({
  // State ban đầu
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Action: Đăng nhập
  login: async (payload: LoginPayload) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(payload);

      set({
        token: data.accessToken,
        isAuthenticated: true,
        user: data.user || { id: '', email: payload.email },
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        'Đăng nhập thất bại. Vui lòng kiểm tra lại email hoặc mật khẩu.';

      const formattedMessage = Array.isArray(message)
        ? message.join(', ')
        : message;

      set({
        error: formattedMessage,
        isLoading: false,
        isAuthenticated: false,
      });
      throw new Error(formattedMessage);
    }
  },

  // Action: Đăng ký
  register: async (payload: RegisterPayload) => {
    set({ isLoading: true, error: null });
    try {
      await authService.register(payload);
      set({ isLoading: false, error: null });
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        'Đăng ký tài khoản thất bại. Email có thể đã tồn tại.';
      const formattedMessage = Array.isArray(message)
        ? message.join(', ')
        : message;

      set({
        error: formattedMessage,
        isLoading: false,
      });
      throw new Error(formattedMessage);
    }
  },

  // Action: Làm mới token
  refreshAuth: async () => {
    try {
      const data = await authService.refreshToken();
      set({
        token: data.accessToken,
        user: data.user,
        isAuthenticated: true,
      });
    } catch {
      set({ token: null, user: null, isAuthenticated: false });
    }
  },

  // Action: Đăng xuất
  logout: async () => {
    await authService.logout();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));
