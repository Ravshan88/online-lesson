import axiosClient from "./axiosClient";

// Check test status (if user has taken test and available question count)
export const checkTestStatus = async () => {
  const res = await axiosClient.get("/test-sessions/check/status");
  return res.data;
};

// Start a new test session with random questions
export const startTestSession = async (numQuestions = 30) => {
  const res = await axiosClient.post("/test-sessions/start", {
    num_questions: numQuestions
  });
  return res.data;
};

// Submit test session answers
export const submitTestSession = async (sessionId, answers, questionIds) => {
  const res = await axiosClient.post("/test-sessions/submit", {
    session_id: sessionId,
    answers: answers,
    question_ids: questionIds
  });
  return res.data;
};

// Get test session history
export const getTestHistory = async (limit = 10) => {
  const res = await axiosClient.get(`/test-sessions/history?limit=${limit}`);
  return res.data;
};

// Get specific test session result
export const getTestSession = async (sessionId) => {
  const res = await axiosClient.get(`/test-sessions/${sessionId}`);
  return res.data;
};

