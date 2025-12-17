import axiosClient from "./axiosClient";

// section_id bo‘yicha materiallarni olish
export const getMaterialsBySection = async (sectionId: any) => {
  const res = await axiosClient.get(`/materials/sectionId/${sectionId}`);
  return res.data;
};

export const getMaterialById = async (id: any) => {
  const res = await axiosClient.get(`/materials/${id}`);
  return res.data;
};

// create material with form-data (files)
export const createMaterial = async (formData) => {
  const res = await axiosClient.post("/materials", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return res.data;
};

// update material (form-data)
export const updateMaterial = async (materialId, formData) => {
  const res = await axiosClient.put(`/materials/${materialId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return res.data;
};

export const deleteMaterial = async (materialId) => {
  const res = await axiosClient.delete(`/materials/${materialId}`);
  return res.data;
};
