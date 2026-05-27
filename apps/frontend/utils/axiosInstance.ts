import axios from "axios";

/**
 * Preconfigured Axios instance for API requests.
 * Authentication is handled entirely via HttpOnly cookies.
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API,
  withCredentials: true,
});

export default api;
