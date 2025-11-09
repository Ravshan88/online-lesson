import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTestsByMaterial, submitTest } from "../api/testsApi";
import { getMaterialById } from "../api/materialsApi";
import { getMaterialProgress } from "../api/progressApi";
import {
  Card,
  Typography,
  Radio,
  Button,
  Space,
  Spin,
  Empty,
  message,
  Result,
  Progress,
  Breadcrumb,
  Alert
} from "antd";
import { HomeOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import AppHeader from "../components/AppHeader";

const { Title, Text } = Typography;

export default function TestPage() {
  const { id: materialId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);

  // Helper function for warning dismissal (keep this in localStorage as it's just UI preference)
  const getWarningDismissedKey = (materialId) =>
    `test_warning_dismissed_${materialId}`;

  // Check if warning was dismissed (persist in localStorage)
  const [warningDismissed, setWarningDismissed] = useState(() => {
    return (
      localStorage.getItem(`test_warning_dismissed_${materialId}`) === "true"
    );
  });

  const { data: material, isLoading: materialLoading } = useQuery({
    queryKey: ["material", materialId],
    queryFn: () => getMaterialById(materialId),
    retry: false
  });

  const { data: tests = [], isLoading: testsLoading } = useQuery({
    queryKey: ["tests", materialId],
    queryFn: () => getTestsByMaterial(materialId),
    enabled: !!materialId,
    retry: false
  });

  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ["progress", materialId],
    queryFn: () => getMaterialProgress(materialId),
    enabled: !!materialId,
    retry: false
  });

  const submitMutation = useMutation({
    mutationFn: (data) => submitTest(materialId, data),
    onSuccess: (data) => {
      setResults(data);
      setSubmitted(true);
      message.success(
        `Test yakunlandi! ${data.correct_count}/${data.total_tests} to'g'ri javob`
      );
      // Invalidate progress queries to refresh progress data from backend
      queryClient.invalidateQueries(["progress", materialId]);
    },
    onError: () => {
      message.error("Test yuborishda xatolik yuz berdi");
    }
  });

  const handleAnswerChange = (testId, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [testId]: answer
    }));
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < tests.length) {
      message.warning("Iltimos, barcha savollarga javob bering");
      return;
    }
    submitMutation.mutate(answers);
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Check if test has already been submitted using backend progress data
  // The backend tracks test progress in user_progress table
  // If there are any test progress entries, it means the test was submitted
  const isTestSubmitted = useMemo(() => {
    if (!materialId || progressLoading || !progress) {
      return false; // If no materialId, still loading, or no progress data, allow access
    }

    // Check if there are any test progress entries
    // The backend creates progress entries for correct answers when test is submitted
    // If any test has progress, it means the test was submitted
    if (progress.test_progress && Array.isArray(progress.test_progress)) {
      // If there are any completed tests, the test was submitted
      const hasCompletedTests = progress.test_progress.some(
        (test) => test.completed === true
      );
      return hasCompletedTests;
    }

    // Also check completed_tests count as fallback
    // If any tests are completed, the test was submitted
    if (progress.completed_tests > 0) {
      return true;
    }

    return false;
  }, [materialId, progressLoading, progress]);

  // Alias for clarity
  const isTestSolved = isTestSubmitted;

  const answeredCount = Object.keys(answers).length;
  const progressPercentage =
    tests.length > 0 ? (answeredCount / tests.length) * 100 : 0;

  if (materialLoading || testsLoading || progressLoading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <Spin size='large' />
      </div>
    );
  }

  if (!material || tests.length === 0) {
    return (
      <div>
        <AppHeader />
        <div className='p-6 text-center'>
          <Empty description='Test mavjud emas' />
          <Button onClick={handleBack} style={{ marginTop: 16 }}>
            Orqaga
          </Button>
        </div>
      </div>
    );
  }

  // If test is already solved, show results view
  // Only check if materialId is available and data is loaded
  if (materialId && isTestSolved && !submitted) {
    return (
      <div>
        <AppHeader />
        <div className='p-6 flex justify-center'>
          <Card style={{ width: "800px" }}>
            <Breadcrumb
              style={{ marginBottom: 16 }}
              items={[
                {
                  title: (
                    <a href='/home'>
                      <HomeOutlined /> Bosh sahifa
                    </a>
                  )
                },
                {
                  title: (
                    <a
                      onClick={() => navigate(-1)}
                      style={{ cursor: "pointer" }}
                    >
                      {material.title}
                    </a>
                  )
                },
                {
                  title: "Test"
                }
              ]}
            />
            <div style={{ marginBottom: 16 }}>
              <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
                Orqaga
              </Button>
            </div>
            <Result
              status='info'
              title='Test allaqachon yechilgan'
              subTitle='Siz bu testni allaqachon yechgansiz. Qayta yechish mumkin emas.'
              extra={[
                <Button type='primary' key='back' onClick={handleBack}>
                  Orqaga qaytish
                </Button>
              ]}
            />
          </Card>
        </div>
      </div>
    );
  }

  if (submitted && results) {
    const percentage = (results.correct_count / results.total_tests) * 100;
    return (
      <div>
        <AppHeader />
        <div className='p-6 flex justify-center'>
          <Card style={{ width: "800px" }}>
            <Breadcrumb
              style={{ marginBottom: 16 }}
              items={[
                {
                  title: (
                    <a href='/home'>
                      <HomeOutlined /> Bosh sahifa
                    </a>
                  )
                },
                {
                  title: (
                    <a
                      onClick={() => navigate(-1)}
                      style={{ cursor: "pointer" }}
                    >
                      {material.title}
                    </a>
                  )
                },
                {
                  title: "Test natijalari"
                }
              ]}
            />
            <div style={{ marginBottom: 16 }}>
              <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
                Orqaga
              </Button>
            </div>
            <Result
              status={percentage >= 50 ? "success" : "warning"}
              title={`Test yakunlandi!`}
              subTitle={`${results.correct_count} ta ${
                results.total_tests
              } ta savoldan to'g'ri javob berdingiz (${percentage.toFixed(
                1
              )}%)`}
              extra={[
                <Button type='primary' key='back' onClick={handleBack}>
                  Orqaga qaytish
                </Button>
              ]}
            />
            <div style={{ marginTop: 24 }}>
              <Title level={4}>Javoblar tafsiloti:</Title>
              {results.results.map((result, index) => (
                <Card
                  key={result.test_id}
                  style={{ marginBottom: 12 }}
                  size='small'
                >
                  <Text strong>
                    {index + 1}. {result.question}
                  </Text>
                  <br />
                  <Text
                    style={{
                      color: result.is_correct ? "green" : "red",
                      marginTop: 8,
                      display: "block"
                    }}
                  >
                    Sizning javobingiz:{" "}
                    {result.user_answer || "Javob berilmagan"}
                    {result.is_correct ? " ✓" : " ✗"}
                  </Text>
                  {!result.is_correct && (
                    <Text style={{ color: "blue", display: "block" }}>
                      To'g'ri javob: {result.correct_answer}
                    </Text>
                  )}
                </Card>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AppHeader />
      <div className='p-6 flex justify-center'>
        <Card style={{ width: "900px" }}>
          <Breadcrumb
            style={{ marginBottom: 16 }}
            items={[
              {
                title: (
                  <a href='/home'>
                    <HomeOutlined /> Bosh sahifa
                  </a>
                )
              },
              {
                title: (
                  <a onClick={() => navigate(-1)} style={{ cursor: "pointer" }}>
                    {material.title}
                  </a>
                )
              },
              {
                title: "Test"
              }
            ]}
          />
          <div style={{ marginBottom: 16 }}>
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
              Orqaga
            </Button>
          </div>
          <Title level={2} className='flex justify-center'>
            {material.title?.charAt(0).toUpperCase() +
              material.title?.substring(1)}{" "}
            - Test
          </Title>
          <Text
            type='secondary'
            style={{ display: "block", textAlign: "center", marginBottom: 24 }}
          >
            Jami {tests.length} ta savol
          </Text>

          {/* Warning message before solving test */}
          {!warningDismissed && !isTestSolved && (
            <Alert
              message='Diqqat!'
              description="Bu testni faqat bir marta yechishingiz mumkin. Testni yuborganingizdan keyin qayta yechish imkoni bo'lmaydi."
              type='warning'
              closable
              onClose={() => {
                setWarningDismissed(true);
                localStorage.setItem(
                  getWarningDismissedKey(materialId),
                  "true"
                );
              }}
              style={{ marginBottom: 24 }}
            />
          )}

          {/* Progress indicator */}
          <div style={{ marginBottom: 24 }}>
            <Progress
              percent={progressPercentage}
              status='active'
              format={(percent) => `${answeredCount} / ${tests.length}`}
            />
            <Text
              type='secondary'
              style={{ display: "block", textAlign: "center", marginTop: 8 }}
            >
              Javob berilgan: {answeredCount} / {tests.length}
            </Text>
          </div>

          <Space direction='vertical' style={{ width: "100%" }} size='large'>
            {tests.map((test, index) => (
              <Card key={test.id} size='small'>
                <Title level={5}>
                  {index + 1}. {test.question}
                </Title>
                <Radio.Group
                  onChange={(e) => handleAnswerChange(test.id, e.target.value)}
                  value={answers[test.id]}
                >
                  <Space direction='vertical'>
                    {test.options.map((option, optIndex) => (
                      <Radio key={optIndex} value={option}>
                        {option}
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
              </Card>
            ))}
          </Space>

          <div style={{ marginTop: 24, textAlign: "center" }}>
            <Space>
              <Button onClick={handleBack}>Bekor qilish</Button>
              <Button
                type='primary'
                size='large'
                onClick={handleSubmit}
                loading={submitMutation.isLoading}
                disabled={
                  Object.keys(answers).length < tests.length ||
                  (materialId && isTestSolved)
                }
              >
                Testni yuborish
              </Button>
            </Space>
          </div>
        </Card>
      </div>
    </div>
  );
}
