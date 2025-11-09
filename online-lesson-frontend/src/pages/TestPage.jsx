import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTestsByMaterial, submitTest } from "../api/testsApi";
import { getMaterialById } from "../api/materialsApi";
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
  Progress
} from "antd";
import AppHeader from "../components/AppHeader";

const { Title, Text } = Typography;

export default function TestPage() {
  const { id: materialId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);

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

  const submitMutation = useMutation({
    mutationFn: (data) => submitTest(materialId, data),
    onSuccess: (data) => {
      setResults(data);
      setSubmitted(true);
      message.success(
        `Test yakunlandi! ${data.correct_count}/${data.total_tests} to'g'ri javob`
      );
      // Invalidate progress queries to refresh progress data
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

  if (materialLoading || testsLoading) {
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

  if (submitted && results) {
    const percentage = (results.correct_count / results.total_tests) * 100;
    return (
      <div>
        <AppHeader />
        <div className='p-6 flex justify-center'>
          <Card style={{ width: "800px" }}>
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
                disabled={Object.keys(answers).length < tests.length}
              >
                Testni yuborish
              </Button>
            </Space>
            <div style={{ marginTop: 12 }}>
              <Text type='secondary'>
                Javob berilgan: {Object.keys(answers).length} / {tests.length}
              </Text>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
