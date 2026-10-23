import api from "./api";

export const signup = async (username, email, password) => {
  const response = await api.post("/users/", { username, email, password });
  return response.data;
};

export const login = async (email, password) => {
  const response = await api.post("/auth/login", { username: email, password });
  return response.data; // { access_token, token_type, user }
};

export const getMe = async () => {
  const response = await api.get("/users/me");
  return response.data;
};

export const logout = async () => {
  try {
    await api.post("/auth/logout");
  } catch (err) {
    console.warn("Logout error:", err);
  }
};
