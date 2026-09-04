
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// Temporary axios config to test AUTH SERVICE.

const authApi = axios.create({
  baseURL: "http://localhost:9001/api",
  withCredentials: true,
});

authApi.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only attempt one refresh for a failed request.
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      try {
        // Refresh token is sent automatically via HttpOnly cookie.
        await authApi.post("/auth/refresh");

        // New access token cookie is now set.
        return authApi(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default authApi;
