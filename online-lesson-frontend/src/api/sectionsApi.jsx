import axiosClient from "./axiosClient";

// Barcha sectionslarni olish
export const getSections = async () => {
  const res = await axiosClient.get("/sections/");
  return res.data;
};