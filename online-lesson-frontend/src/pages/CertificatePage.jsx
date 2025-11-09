import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getTestSession } from "../api/testSessionsApi";
import { userApi } from "../api/userApi";
import {
  Card,
  Typography,
  Button,
  Space,
  Spin,
  Divider,
  Row,
  Col,
  Tag
} from "antd";
import {
  DownloadOutlined,
  HomeOutlined,
  TrophyOutlined,
  CloseCircleOutlined
} from "@ant-design/icons";
import AppHeader from "../components/AppHeader";

const { Title, Text, Paragraph } = Typography;

export default function CertificatePage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  // Get user data
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => userApi.me()
  });

  // Get test session data
  const { data: session, isLoading } = useQuery({
    queryKey: ["testSession", sessionId],
    queryFn: () => getTestSession(sessionId),
    retry: false
  });

  const handleDownload = () => {
    const token = localStorage.getItem("access_token");
    const url = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/test-sessions/certificate/${sessionId}`;
    
    // Create a temporary link and click it
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("Authorization", `Bearer ${token}`);
    link.download = `certificate_${user?.firstname}_${user?.lastname}.pdf`;
    
    // For authenticated download
    fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `certificate_${user?.firstname}_${user?.lastname}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      });
  };

  if (isLoading) {
    return (
      <div>
        <AppHeader />
        <div className='flex justify-center items-center h-screen'>
          <Spin size='large' />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div>
        <AppHeader />
        <div className='flex justify-center items-center h-screen'>
          <Card>
            <Title level={3}>Sertifikat topilmadi</Title>
            <Button onClick={() => navigate("/home")}>Bosh sahifa</Button>
          </Card>
        </div>
      </div>
    );
  }

  // Check if user passed
  const passed = session.passed === 1;
  
  if (!passed) {
    return (
      <div>
        <AppHeader />
        <div className='flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
          <Card style={{ maxWidth: "500px", textAlign: "center", padding: "40px" }}>
            <CloseCircleOutlined style={{ fontSize: "64px", color: "#ff4d4f" }} />
            <Title level={3} style={{ marginTop: "24px" }}>
              Sertifikat mavjud emas
            </Title>
            <Paragraph style={{ fontSize: "16px", color: "#666" }}>
              Sertifikat olish uchun testdan kamida 75% ball bilan o'tish kerak.
            </Paragraph>
            <Paragraph style={{ fontSize: "16px" }}>
              Sizning natijangiz: <strong>{session.score_percentage}%</strong>
            </Paragraph>
            <Button 
              type="primary" 
              size="large"
              onClick={() => navigate("/home")}
              style={{ marginTop: "16px" }}
            >
              Bosh sahifa
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const fullName = `${user?.firstname || ""} ${user?.lastname || ""}`;
  const percentage = session.score_percentage;
  const scoreColor = percentage >= 70 ? "#52c41a" : percentage >= 50 ? "#faad14" : "#ff4d4f";

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
            {/* Certificate Preview */}
            <div
              style={{
                border: "3px solid #faad14",
                borderRadius: "8px",
                padding: "40px",
                background: "white",
                position: "relative"
              }}
            >
              {/* Inner border */}
              <div
                style={{
                  border: "1px solid #012c6e",
                  borderRadius: "4px",
                  padding: "40px",
                  minHeight: "600px"
                }}
              >
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <Title
                    level={1}
                    style={{
                      color: "#faad14",
                      fontWeight: "bold",
                      margin: 0
                    }}
                  >
                    OXU
                  </Title>
                </div>

                {/* Title */}
                <div style={{ textAlign: "center", marginBottom: "30px" }}>
                  <Title
                    level={1}
                    style={{
                      color: "#012c6e",
                      fontWeight: "bold",
                      margin: 0,
                      fontSize: "48px"
                    }}
                  >
                    SERTIFIKAT
                  </Title>
                  <Text
                    style={{
                      fontSize: "18px",
                      color: "#666666"
                    }}
                  >
                    Yakuniy Test Natijalari
                  </Text>
                </div>

                <Divider style={{ borderColor: "#faad14", borderWidth: "2px" }} />

                {/* Certificate text */}
                <div style={{ textAlign: "center", marginTop: "40px" }}>
                  <Paragraph style={{ fontSize: "16px", marginBottom: "20px" }}>
                    Ushbu sertifikat quyidagi shaxsga beriladi:
                  </Paragraph>

                  <Title
                    level={2}
                    style={{
                      color: "#012c6e",
                      fontWeight: "bold",
                      margin: "20px 0"
                    }}
                  >
                    {fullName}
                  </Title>

                  <Paragraph style={{ fontSize: "16px", marginTop: "20px" }}>
                    Yakuniy testni muvaffaqiyatli yakunladi
                  </Paragraph>
                </div>

                {/* Results box */}
                <div
                  style={{
                    background: "#f0f0f0",
                    padding: "30px",
                    borderRadius: "8px",
                    margin: "40px auto",
                    maxWidth: "400px"
                  }}
                >
                  <Title
                    level={4}
                    style={{
                      color: "#012c6e",
                      textAlign: "center",
                      marginBottom: "15px"
                    }}
                  >
                    Natijalar:
                  </Title>
                  <div style={{ textAlign: "center" }}>
                    <Text style={{ fontSize: "16px", display: "block" }}>
                      To'g'ri javoblar: {session.correct_answers} /{" "}
                      {session.total_questions}
                    </Text>
                    <Title
                      level={3}
                      style={{
                        color: scoreColor,
                        margin: "10px 0 0 0"
                      }}
                    >
                      Natija: {percentage}%
                    </Title>
                  </div>
                </div>

                {/* Date */}
                <div style={{ textAlign: "center", marginTop: "30px" }}>
                  <Text style={{ fontSize: "14px" }}>
                    Sana: {new Date(session.created_at).toLocaleDateString("uz-UZ")}
                  </Text>
                </div>

                {/* Footer */}
                <div
                  style={{
                    textAlign: "center",
                    marginTop: "50px",
                    color: "#666666"
                  }}
                >
                  <Text style={{ fontSize: "12px", fontStyle: "italic", display: "block" }}>
                    Online Ta'lim Platformasi
                  </Text>
                  <Text style={{ fontSize: "12px", fontStyle: "italic" }}>
                    www.online-lesson.uz
                  </Text>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <Divider />
            <Row gutter={16} style={{ marginTop: "24px" }}>
              <Col xs={24} sm={12}>
                <Button
                  type='primary'
                  size='large'
                  block
                  icon={<DownloadOutlined />}
                  onClick={handleDownload}
                  style={{
                    background: "#52c41a",
                    borderColor: "#52c41a"
                  }}
                >
                  Sertifikatni Yuklash (PDF)
                </Button>
              </Col>
              <Col xs={24} sm={12}>
                <Button
                  size='large'
                  block
                  icon={<HomeOutlined />}
                  onClick={() => navigate("/home")}
                >
                  Bosh sahifa
                </Button>
              </Col>
            </Row>
          </Card>
        </div>
      </div>
    </div>
  );
}

