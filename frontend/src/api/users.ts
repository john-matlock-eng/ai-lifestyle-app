import apiClient from "./client";

interface User {
  userId: string;
  email: string;
  name?: string;
  hasEncryption: boolean;
}

const usersApi = {
  async getUserByEmail(email: string): Promise<User> {
    const { data } = await apiClient.get<User>(
      `/users/by-email/${encodeURIComponent(email)}`,
    );
    return data;
  },

  async checkUserExists(email: string): Promise<boolean> {
    try {
      await usersApi.getUserByEmail(email);
      return true;
    } catch {
      return false;
    }
  },
};

export default usersApi;

export const { getUserByEmail, checkUserExists } = usersApi;
