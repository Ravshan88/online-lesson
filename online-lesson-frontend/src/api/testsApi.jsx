import axiosClient from "./axiosClient";

// Get tests by material ID
export const getTestsByMaterial = async (materialId) => {
  const res = await axiosClient.get(`/tests/material/${materialId}`);
  return res.data;
};

// Submit test answers
export const submitTest = async (materialId, answers) => {
  const res = await axiosClient.post("/progress/submit-test", {
    material_id: materialId,
    answers: answers
  });
  return res.data;
};

