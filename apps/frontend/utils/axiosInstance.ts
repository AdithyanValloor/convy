
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

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
        await api.post("/auth/refresh");

        // New access token cookie is now set.
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
