import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

/**
 * Preconfigured Axios instance for API requests.
 * Authentication is handled entirely via HttpOnly cookies.
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & {
          _retry?: boolean;
        })
      | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const isUnauthorized = error.response?.status === 401;

    const isRefreshRequest =
      originalRequest.url?.includes("/auth/refresh");

    const isLoginRequest =
      originalRequest.url?.includes("/auth/login");

    // Only refresh once, and never refresh login/refresh requests.
    if (
      isUnauthorized &&
      !originalRequest._retry &&
      !isRefreshRequest &&
      !isLoginRequest
    ) {
      originalRequest._retry = true;

      try {
        // Refresh token is sent automatically via HttpOnly cookie.
        await api.post("/auth/refresh");

        // New access-token cookie has been set.
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;