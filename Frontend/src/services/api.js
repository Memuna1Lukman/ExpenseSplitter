import axios from "axios";

const api = axios.create({
  baseURL: "https://expensesplitter-raw-4x4f-9q96ru3ju-munatu-s-projects1.vercel.app",
});

// automatically attach the JWT token to every request, if we have one
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;