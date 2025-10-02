import axiosClient from "./axiosClient";

export const userApi = {
  // Ro‘yxatdan o‘tish
  register: async (data) => {
    const res = await axiosClient.post("/user", data);
    return res.data;
  },

  // Login qilish
  login: async (data) => {
    const res = await axiosClient.post("/auth/login", data);
    return res.data; // backend token qaytarishi kerak
  },

  // Hozirgi userni olish
  me: async () => {
    const res = await axiosClient.get("/auth/me");
    return res.data;
  }
};

export default userApi;
