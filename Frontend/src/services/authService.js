import api from "./api";

export const signup = async (username, email, password) => {
  const response = await api.post("/users/", { username, email, password });
  return response.data;
};

export const login = async (email, password) => {
  const response = await api.post("/auth/login", { username: email, password });
  return response.data; // expects { access_token, token_type }
};