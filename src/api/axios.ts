import { useUserStore } from "@/store/user";
import axios, { AxiosError, CreateAxiosDefaults } from "axios";

const baseConfig: CreateAxiosDefaults = {
  baseURL: `${import.meta.env.VITE_API_URL}`,
  withCredentials: false,
  headers: {
    Accept: "*/*",
  },
};

export const instanceWithoutInterceptors = axios.create(baseConfig);

export const instance = axios.create(baseConfig);

instance.interceptors.request.use(
  function (config) {
    console.log("🔄 Request Interceptor - Starting request:", {
      url: config.url,
      method: config.method,
      headers: config.headers,
    });

    const accessToken = useUserStore.getState().user?.accessToken;

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  function (error) {
    console.error("Request Interceptor - Error:", error);
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  function (response) {
    return response;
  },
  async function (error: AxiosError) {
    if (error.response?.status === 401) {
      useUserStore.getState().removeCredentials();
    }
    return Promise.reject(error);
  }
);
