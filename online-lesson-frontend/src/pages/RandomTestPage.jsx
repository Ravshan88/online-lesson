import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  checkTestStatus,
  startTestSession,
  submitTestSession,
  getTestSession
} from "../api/testSessionsApi";
import {
  Card,
  Typography,
  Radio,
  Button,
  Space,
  Spin,
  message,
  Result,
  Progress,
  Modal,
  InputNumber,
  Divider,
  Tag,
  Timeline,
  Empty,
  Row,
  Col,
  Statistic
} from "antd";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TrophyOutlined,
  HistoryOutlined,
  RocketOutlined,
  FileTextOutlined
} from "@ant-design/icons";
import AppHeader from "../components/AppHeader";

const { Title, Text, Paragraph } = Typography;

export default function RandomTestPage() {
  const navigate = useNavigate();
  const [testState, setTestState] = useState("initial"); // initial, loading, testing, submitted, already_taken
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Check test status on mount
  const { data: testStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["testStatus"],
    queryFn: checkTestStatus,
    retry: false
  });

  // Load existing result if user has already taken test
  useEffect(() => {
    if (testStatus?.has_taken_test && testStatus?.existing_session_id) {
      // Load the existing session result
      getTestSession(testStatus.existing_session_id).then((data) => {
        setResults(data);
        setTestState("already_taken");
      }).catch(() => {
        setTestState("already_taken");
      });
    }
  }, [testStatus]);

  // Start test mutation
  const startTestMutation = useMutation({
    mutationFn: () => startTestSession(30),
    onSuccess: (data) => {
      setSessionId(data.session_id);
      setQuestions(data.questions);
      setTestState("testing");
      setAnswers({});
      setCurrentQuestionIndex(0);
      message.success("Test boshlandi! Omad!");
    },
    onError: (error) => {
      message.error(
        error.response?.data?.detail || "Test boshlashda xatolik yuz berdi"
      );
      setTestState("initial");
    }
  });

  // Submit test mutation
  const submitMutation = useMutation({
    mutationFn: (data) => submitTestSession(data.sessionId, data.answers, data.questionIds),
    onSuccess: (data) => {
      setResults(data);
      setTestState("submitted");
      message.success(
        `Test yakunlandi! ${data.correct_answers}/${data.total_questions} to'g'ri javob`
      );
    },
    onError: () => {
      message.error("Test yuborishda xatolik yuz berdi");
    }
  });

  const handleStartTest = () => {
    setTestState("loading");
    startTestMutation.mutate();
  };

  const handleAnswerChange = (testId, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [testId]: answer
    }));
  };

  const handleSubmit = () => {
    // Get all question IDs from the session
    const questionIds = questions.map(q => q.id);
    
    if (Object.keys(answers).length < questions.length) {
      Modal.confirm({
        title: "Barcha savollarga javob berilmagan",
        content: `Siz ${Object.keys(answers).length}/${
          questions.length
        } ta savolga javob berdingiz. Davom etmoqchimisiz?`,
        okText: "Ha, yuborish",
        cancelText: "Yo'q, qaytish",
        onOk: () => {
          submitMutation.mutate({ sessionId, answers, questionIds });
        }
      });
      return;
    }
    submitMutation.mutate({ sessionId, answers, questionIds });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleQuestionJump = (index) => {
    setCurrentQuestionIndex(index);
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return "#52c41a";
    if (percentage >= 60) return "#1890ff";
    if (percentage >= 40) return "#faad14";
    return "#f5222d";
  };

  const getScoreStatus = (percentage) => {
    if (percentage >= 80) return "A'lo";
    if (percentage >= 60) return "Yaxshi";
    if (percentage >= 40) return "Qoniqarli";
    return "Qoniqarsiz";
  };

  // Initial screen
  if (testState === "initial") {
    if (statusLoading) {
      return (
        <div>
          <AppHeader />
          <div className='flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
            <Card style={{ textAlign: "center", padding: "40px" }}>
              <Spin size='large' />
              <Title level={4} style={{ marginTop: "24px" }}>
                Yuklanmoqda...
              </Title>
            </Card>
          </div>
        </div>
      );
    }

    return (
      <div>
        <AppHeader />
        <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6'>
          <div className='max-w-4xl mx-auto'>
            <Card
              className='shadow-lg'
              style={{
                borderRadius: "16px",
                background: "white"
              }}
            >
              <div className='text-center mb-8'>
                <RocketOutlined
                  style={{ fontSize: "64px", color: "#1890ff" }}
                />
                <Title level={2} style={{ marginTop: "16px" }}>
                  Yakuniy Test
                </Title>
                <Paragraph type='secondary' style={{ fontSize: "16px" }}>
                  O'z bilimingizni sinab ko'ring! Testlar tasodifiy tartibda
                  taqdim etiladi.
                </Paragraph>
              </div>

              <Divider />

              <div style={{ maxWidth: "500px", margin: "32px auto" }}>
                  <div style={{ marginTop: "24px" }}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic
                          title="Testdagi savollar soni:"
                          value={testStatus?.test_question_count || 0}
                          valueStyle={{ color: "#1890ff" }}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="O'tish foizi:"
                          value={75}
                          suffix="%"
                          valueStyle={{ color: "#52c41a" }}
                        />
                      </Col>
                    </Row>
                    <Button
                      type='primary'
                      size='large'
                      block
                      onClick={handleStartTest}
                      icon={<RocketOutlined />}
                      style={{ marginTop: "24px" }}
                    >
                      Testni Boshlash
                    </Button>
                  </div>
              </div>

              <Divider />

              <div style={{ marginTop: "24px" }}>
                <Title level={5}>
                  <TrophyOutlined /> Qoidalar:
                </Title>
                <ul style={{ paddingLeft: "24px" }}>
                  <li>Testlar tasodifiy tartibda taqdim etiladi</li>
                  <li>Testni faqat bir marta topshirish mumkin</li>
                  <li>Barcha savollarga javob bergandan keyin natijani ko'rasiz</li>
                  <li>Natijalaringiz avtomatik saqlanadi</li>
                  <li>
                    Kelajakda sertifikat olish uchun natijalaringiz hisobga
                    olinadi
                  </li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Already taken screen
  if (testState === "already_taken") {
    const percentage = results?.score_percentage || 0;
    const passed = results?.passed === 1;
    
    return (
      <div>
        <AppHeader />
        <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6'>
          <div className='max-w-4xl mx-auto'>
            <Card
              style={{
                borderRadius: "16px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
              }}
            >
              <Result
                status={passed ? "success" : "warning"}
                icon={passed ? 
                  <CheckCircleOutlined style={{ fontSize: "72px", color: "#52c41a" }} /> :
                  <CloseCircleOutlined style={{ fontSize: "72px", color: "#ff4d4f" }} />
                }
                title={
                  <Title level={2}>
                    Siz allaqachon yakuniy testni topshirgansiz
                  </Title>
                }
                subTitle={
                  <Space direction='vertical' size='large'>
                    <div>
                      <Text style={{ fontSize: "16px" }}>
                        Yakuniy testni faqat bir marta topshirish mumkin.
                      </Text>
                    </div>
                    {results && (
                      <div>
                        <Title level={3} style={{ margin: 0 }}>
                          {results.correct_answers} / {results.total_questions}
                        </Title>
                        <Text type='secondary' style={{ fontSize: "16px" }}>
                          to'g'ri javob
                        </Text>
                        <div style={{ marginTop: "16px" }}>
                          <Progress
                            type='circle'
                            percent={percentage}
                            width={120}
                            strokeColor={getScoreColor(percentage)}
                            format={(percent) => (
                              <div>
                                <div style={{ fontSize: "24px", fontWeight: "bold" }}>
                                  {percent}%
                                </div>
                                <div style={{ fontSize: "12px" }}>
                                  {getScoreStatus(percent)}
                                </div>
                              </div>
                            )}
                          />
                        </div>
                        <div style={{ marginTop: "16px" }}>
                          {!passed && (
                            <div style={{ marginTop: "8px" }}>
                              <Text type='secondary' style={{ fontSize: "14px" }}>
                                O'tish uchun kamida 75% ball kerak
                              </Text>
                            </div>
                          )}
                        </div>
                        <Text type='secondary' style={{ display: "block", marginTop: "16px" }}>
                          Test topshirilgan: {new Date(results.created_at).toLocaleString("uz-UZ")}
                        </Text>
                      </div>
                    )}
                  </Space>
                }
                extra={passed ? [
                  <Button
                    size='large'
                    key='certificate'
                    type='primary'
                    icon={<FileTextOutlined />}
                    onClick={() => navigate(`/certificate/${results.id}`)}
                    style={{
                      background: "#52c41a",
                      borderColor: "#52c41a"
                    }}
                  >
                    Sertifikatni Ko'rish
                  </Button>,
                  <Button
                    size='large'
                    key='home'
                    onClick={() => navigate("/home")}
                  >
                    Bosh sahifa
                  </Button>
                ] : [
                  <Button
                    size='large'
                    key='home'
                    type='primary'
                    onClick={() => navigate("/home")}
                  >
                    Bosh sahifa
                  </Button>
                ]}
              />

              {results && results.test_data?.results && (
                <>
                  <Divider />
                  <div style={{ marginTop: "24px" }}>
                    <Title level={4}>
                      <CheckCircleOutlined /> Javoblar tafsiloti:
                    </Title>
                    <Space direction='vertical' style={{ width: "100%" }} size='middle'>
                      {results.test_data.results.map((result, index) => (
                        <Card
                          key={result.test_id}
                          size='small'
                          style={{
                            border: result.is_correct
                              ? "2px solid #52c41a"
                              : "2px solid #ff4d4f",
                            borderRadius: "8px"
                          }}
                        >
                          <Row gutter={16} align='middle'>
                            <Col span={1}>
                              {result.is_correct ? (
                                <CheckCircleOutlined
                                  style={{ fontSize: "24px", color: "#52c41a" }}
                                />
                              ) : (
                                <CloseCircleOutlined
                                  style={{ fontSize: "24px", color: "#ff4d4f" }}
                                />
                              )}
                            </Col>
                            <Col span={23}>
                              <Text strong style={{ fontSize: "16px" }}>
                                {index + 1}. {result.question}
                              </Text>
                              <br />
                              <Text
                                style={{
                                  color: result.is_correct ? "#52c41a" : "#ff4d4f",
                                  marginTop: "8px",
                                  display: "block"
                                }}
                              >
                                Sizning javobingiz:{" "}
                                <strong>
                                  {result.user_answer || "Javob berilmagan"}
                                </strong>
                              </Text>
                              {!result.is_correct && (
                                <Text
                                  style={{
                                    color: "#1890ff",
                                    display: "block",
                                    marginTop: "4px"
                                  }}
                                >
                                  To'g'ri javob: <strong>{result.correct_answer}</strong>
                                </Text>
                              )}
                            </Col>
                          </Row>
                        </Card>
                      ))}
                    </Space>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Loading screen
  if (testState === "loading") {
    return (
      <div>
        <AppHeader />
        <div className='flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
          <Card style={{ textAlign: "center", padding: "40px" }}>
            <Spin size='large' />
            <Title level={4} style={{ marginTop: "24px" }}>
              Test tayyorlanmoqda...
            </Title>
            <Text type='secondary'>Savollar tasodifiy tanlanmoqda</Text>
          </Card>
        </div>
      </div>
    );
  }

  // Testing screen
  if (testState === "testing") {
    const currentQuestion = questions[currentQuestionIndex];
    const answeredCount = Object.keys(answers).length;
    const progressPercent = (answeredCount / questions.length) * 100;

    return (
      <div>
        <AppHeader />
        <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6'>
          <div className='max-w-5xl mx-auto'>
            {/* Progress Header */}
            <Card
              style={{
                marginBottom: "16px",
                borderRadius: "12px",
                background: "white"
              }}
            >
              <Row gutter={16} align='middle'>
                <Col xs={24} md={12}>
                  <Space>
                    <ClockCircleOutlined style={{ fontSize: "20px" }} />
                    <div>
                      <Text strong>Savol:</Text>
                      <Text style={{ marginLeft: "8px", fontSize: "18px" }}>
                        {currentQuestionIndex + 1} / {questions.length}
                      </Text>
                    </div>
                  </Space>
                </Col>
                <Col xs={24} md={12}>
                  <div>
                    <Text strong>Javob berilgan: </Text>
                    <Text style={{ fontSize: "16px" }}>
                      {answeredCount} / {questions.length}
                    </Text>
                    <Progress
                      percent={progressPercent}
                      size='small'
                      style={{ marginTop: "8px" }}
                      strokeColor={{
                        "0%": "#108ee9",
                        "100%": "#87d068"
                      }}
                    />
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Question Card */}
            <Card
              style={{
                borderRadius: "12px",
                minHeight: "400px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
              }}
            >
              <Title level={4} style={{ marginBottom: "24px" }}>
                {currentQuestionIndex + 1}. {currentQuestion.question}
              </Title>

              <Radio.Group
                onChange={(e) =>
                  handleAnswerChange(currentQuestion.id, e.target.value)
                }
                value={answers[currentQuestion.id]}
                style={{ width: "100%" }}
              >
                <Space direction='vertical' style={{ width: "100%" }} size='middle'>
                  {currentQuestion.options.map((option, optIndex) => (
                    <Card
                      key={optIndex}
                      hoverable
                      style={{
                        border:
                          answers[currentQuestion.id] === option
                            ? "2px solid #1890ff"
                            : "1px solid #d9d9d9",
                        borderRadius: "8px",
                        background:
                          answers[currentQuestion.id] === option
                            ? "#e6f7ff"
                            : "white"
                      }}
                    >
                      <Radio value={option} style={{ width: "100%" }}>
                        <Text
                          strong={answers[currentQuestion.id] === option}
                          style={{ fontSize: "16px" }}
                        >
                          {option}
                        </Text>
                      </Radio>
                    </Card>
                  ))}
                </Space>
              </Radio.Group>

              <Divider />

              {/* Navigation Buttons */}
              <Row gutter={16}>
                <Col span={8}>
                  <Button
                    size='large'
                    block
                    onClick={handlePrevQuestion}
                    disabled={currentQuestionIndex === 0}
                  >
                    ← Oldingi
                  </Button>
                </Col>
                <Col span={8}>
                  <Button
                    type='primary'
                    size='large'
                    block
                    onClick={handleSubmit}
                    loading={submitMutation.isLoading}
                    danger
                  >
                    Yakunlash
                  </Button>
                </Col>
                <Col span={8}>
                  <Button
                    size='large'
                    block
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex === questions.length - 1}
                  >
                    Keyingi →
                  </Button>
                </Col>
              </Row>
            </Card>

            {/* Question Navigator */}
            <Card
              style={{
                marginTop: "16px",
                borderRadius: "12px"
              }}
            >
              <Title level={5}>Savollar bo'yicha navigatsiya:</Title>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginTop: "16px"
                }}
              >
                {questions.map((q, index) => (
                  <Button
                    key={q.id}
                    type={
                      index === currentQuestionIndex
                        ? "primary"
                        : answers[q.id]
                        ? "default"
                        : "dashed"
                    }
                    onClick={() => handleQuestionJump(index)}
                    style={{
                      minWidth: "48px",
                      background: answers[q.id]
                        ? index === currentQuestionIndex
                          ? "#1890ff"
                          : "#52c41a"
                        : undefined,
                      color:
                        answers[q.id] && index !== currentQuestionIndex
                          ? "white"
                          : undefined
                    }}
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>
              <div style={{ marginTop: "16px" }}>
                <Space>
                  <Tag color='blue'>Joriy savol</Tag>
                  <Tag color='green'>Javob berilgan</Tag>
                  <Tag>Javob berilmagan</Tag>
                </Space>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Results screen
  if (testState === "submitted" && results) {
    const percentage = results.score_percentage;
    const passed = results.passed === 1;
    const testData = results.test_data.results;

    return (
      <div>
        <AppHeader />
        <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6'>
          <div className='max-w-4xl mx-auto'>
            <Card
              style={{
                borderRadius: "16px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
              }}
            >
              <Result
                status={passed ? "success" : "warning"}
                title={
                  <Title level={2}>
                    {passed
                      ? "🎉 Tabriklaymiz!"
                      : "📊 Yaxshi urinish!"}
                  </Title>
                }
                subTitle={
                  <Space direction='vertical' size='large'>
                    <div>
                      <Title level={3} style={{ margin: 0 }}>
                        {results.correct_answers} / {results.total_questions}
                      </Title>
                      <Text type='secondary' style={{ fontSize: "16px" }}>
                        to'g'ri javob
                      </Text>
                    </div>
                    <Progress
                      type='circle'
                      percent={percentage}
                      width={150}
                      strokeColor={getScoreColor(percentage)}
                      format={(percent) => (
                        <div>
                          <div style={{ fontSize: "32px", fontWeight: "bold" }}>
                            {percent}%
                          </div>
                          <div style={{ fontSize: "14px" }}>
                            {getScoreStatus(percent)}
                          </div>
                        </div>
                      )}
                    />
                    <div style={{ marginTop: "16px" }}>
                      {!passed && (
                        <div style={{ marginTop: "12px" }}>
                          <Text type='secondary' style={{ fontSize: "14px" }}>
                            O'tish uchun kamida 75% ball kerak edi
                          </Text>
                        </div>
                      )}
                      {passed && (
                        <div style={{ marginTop: "12px" }}>
                          <Text type='success' style={{ fontSize: "14px" }}>
                            Siz testdan muvaffaqiyatli o'tdingiz!
                          </Text>
                        </div>
                      )}
                    </div>
                  </Space>
                }
                extra={passed ? [
                  <Button
                    type='primary'
                    size='large'
                    key='certificate'
                    icon={<FileTextOutlined />}
                    onClick={() => navigate(`/certificate/${results.id}`)}
                    style={{
                      background: "#52c41a",
                      borderColor: "#52c41a"
                    }}
                  >
                    Sertifikatni Ko'rish
                  </Button>,
                  <Button
                    size='large'
                    key='home'
                    onClick={() => navigate("/home")}
                  >
                    Bosh sahifa
                  </Button>
                ] : [
                  <Button
                    size='large'
                    key='home'
                    type='primary'
                    onClick={() => navigate("/home")}
                  >
                    Bosh sahifa
                  </Button>
                ]}
              />

              <Divider />

              <div style={{ marginTop: "24px" }}>
                <Title level={4}>
                  <CheckCircleOutlined /> Javoblar tafsiloti:
                </Title>
                <Space direction='vertical' style={{ width: "100%" }} size='middle'>
                  {testData.map((result, index) => (
                    <Card
                      key={result.test_id}
                      size='small'
                      style={{
                        border: result.is_correct
                          ? "2px solid #52c41a"
                          : "2px solid #ff4d4f",
                        borderRadius: "8px"
                      }}
                    >
                      <Row gutter={16} align='middle'>
                        <Col span={1}>
                          {result.is_correct ? (
                            <CheckCircleOutlined
                              style={{ fontSize: "24px", color: "#52c41a" }}
                            />
                          ) : (
                            <CloseCircleOutlined
                              style={{ fontSize: "24px", color: "#ff4d4f" }}
                            />
                          )}
                        </Col>
                        <Col span={23}>
                          <Text strong style={{ fontSize: "16px" }}>
                            {index + 1}. {result.question}
                          </Text>
                          <br />
                          <Text
                            style={{
                              color: result.is_correct ? "#52c41a" : "#ff4d4f",
                              marginTop: "8px",
                              display: "block"
                            }}
                          >
                            Sizning javobingiz:{" "}
                            <strong>
                              {result.user_answer || "Javob berilmagan"}
                            </strong>
                          </Text>
                          {!result.is_correct && (
                            <Text
                              style={{
                                color: "#1890ff",
                                display: "block",
                                marginTop: "4px"
                              }}
                            >
                              To'g'ri javob: <strong>{result.correct_answer}</strong>
                            </Text>
                          )}
                        </Col>
                      </Row>
                    </Card>
                  ))}
                </Space>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

