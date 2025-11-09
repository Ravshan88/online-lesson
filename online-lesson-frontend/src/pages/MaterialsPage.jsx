import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueries } from "@tanstack/react-query";
import { getMaterialsBySection } from "../api/materialsApi";
import { getMaterialProgress } from "../api/progressApi";
import {
  Card,
  Row,
  Col,
  Typography,
  Spin,
  Tag,
  Empty,
  Progress,
  Breadcrumb,
  Button
} from "antd";
import { HomeOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import AppHeader from "../components/AppHeader";

const { Title, Paragraph } = Typography;

export default function MaterialsPage() {
  const { section, id } = useParams(); // section id URLdan olinadi
  const navigate = useNavigate();

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ["materials", id],
    queryFn: () => getMaterialsBySection(id)
  });

  // Fetch progress for all materials
  const progressQueries = useQueries({
    queries: materials.map((material) => ({
      queryKey: ["progress", material.id],
      queryFn: () => getMaterialProgress(material.id),
      enabled: !!material.id,
      retry: false
    }))
  });

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <Spin size='large' />
      </div>
    );
  }
  if (materials.length === 0) {
    return (
      <div>
        <h1>{section}</h1>
        <br />
        <Empty />
      </div>
    );
  }

  const handleCardClick = (material_id) => {
    navigate(`material/${material_id}`);
  };

  const handleBack = () => {
    navigate("/home");
  };

  return (
    <div>
      <AppHeader />
      <div className='p-6'>
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
              title: section
            }
          ]}
        />
        <div style={{ marginBottom: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            Orqaga
          </Button>
        </div>
        <Title className=' flex justify-center'>{section}</Title>
        <Row className='p-6' gutter={[16, 16]}>
          {materials.map((m, i) => {
            const progressData = progressQueries[i]?.data;
            const percentage = progressData?.percentage || 0;
            return (
              <Col key={m.id} onClick={() => handleCardClick(m.id)}>
                <Card hoverable>
                  <Title level={5}>
                    {m.title.charAt(0).toUpperCase() + m.title.substring(1)}
                  </Title>
                  {progressData && (
                    <div style={{ marginTop: 12 }}>
                      <Progress
                        percent={percentage}
                        size='small'
                        status={percentage === 100 ? "success" : "active"}
                      />
                      <div
                        style={{ marginTop: 4, fontSize: 12, color: "#666" }}
                      >
                        {progressData.completed_tests} /{" "}
                        {progressData.total_tests} test
                        {progressData.pdf_completed && " • PDF"}
                        {progressData.video_completed && " • Video"}
                      </div>
                    </div>
                  )}
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>
    </div>
  );
}
