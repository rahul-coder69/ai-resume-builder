import axios from "axios";

const rawBaseURL = import.meta.env.VITE_BASE_URL;
const PLACEHOLDER_RENDER_HOST = "your-render-service.onrender.com";
const DEFAULT_PROD_BASE_URL = "https://resume-builder-0d7z.onrender.com";
const DEFAULT_DEV_BASE_URL = "http://localhost:3000";

const normalizeBaseURL = (url) => {
  const trimmed = (url || "").trim().replace(/\/+$/, "");

  // Vercel/Netlify env mistakes like "my-api.onrender.com" create relative calls.
  // Force https for host-like values that do not include protocol.
  if (trimmed && !/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return trimmed;
};

const normalizedBaseURL = normalizeBaseURL(rawBaseURL);

const resolvedBaseURL = import.meta.env.DEV
  ? DEFAULT_DEV_BASE_URL
  : normalizedBaseURL || DEFAULT_PROD_BASE_URL;

const api = axios.create({
  baseURL: resolvedBaseURL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const baseURL = String(config.baseURL || "");

  if (baseURL.includes(PLACEHOLDER_RENDER_HOST)) {
    return Promise.reject(
      new Error(
        "Set VITE_BASE_URL in Vercel or Netlify to your real Render URL.",
      ),
    );
  }

  const token = localStorage.getItem("token");
  if (token && !config.headers?.Authorization) {
    config.headers = config.headers || {};
    config.headers.Authorization = token;
  }

  return config;
});

export default api;
