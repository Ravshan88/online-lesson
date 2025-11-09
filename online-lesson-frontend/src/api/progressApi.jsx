import axiosClient from "./axiosClient";

// Get material progress
export const getMaterialProgress = async (materialId) => {
  const res = await axiosClient.get(`/progress/material/${materialId}`);
  return res.data;
};

// Mark attachment as completed (PDF or video viewed/downloaded)
export const markAttachmentComplete = async (attachmentId) => {
  const res = await axiosClient.post("/progress/complete", {
    user_id: 0, // Will be ignored, backend uses current_user
    attachment_id: attachmentId,
    test_id: null
  });
  return res.data;
};

