import axios from "axios";
import { auth } from "@/lib/firebase/config";

const apiClient = axios.create({
  //baseURL: "/api",
  baseURL: "https://localhost/api",
  withCredentials: true,
});

apiClient.interceptors.request.use(async (config) => {
  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
    }
    return Promise.reject(error);
  }
);

export default apiClient;
