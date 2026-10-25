import api from "./api";

export const getExpenses = async () => {
  const response = await api.get("/expenses/");
  return response.data;
};

export const createExpense = async (expenseData) => {
  const response = await api.post("/expenses/", expenseData);
  return response.data;
};

export const getGroups = async () => {
  const response = await api.get("/groups/");
  return response.data;
};

export const createGroup = async (groupData) => {
  const response = await api.post("/groups/", groupData);
  return response.data;
};

export const getGroupMembers = async (groupId) => {
  const response = await api.get(`/groups/${groupId}/members`);
  return response.data;
};

export const addGroupMember = async (groupId, userId) => {
  const response = await api.post(`/groups/${groupId}/members`, {
    group_id: groupId,
    user_id: userId,
  });
  return response.data;
};

export const createGroupInvite = async (groupId, email) => {
  const response = await api.post(`/groups/${groupId}/invites`, { email });
  return response.data;
};

export const acceptGroupInvite = async (token) => {
  const response = await api.post('/invites/accept', { token });
  return response.data;
};

export const getUsers = async () => {
  const response = await api.get("/users/");
  return response.data;
};
