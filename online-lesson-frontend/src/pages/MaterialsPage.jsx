import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMaterialsBySection } from "../api/materialsApi";
import { Card, Row, Col, Typography, Spin, Tag, Empty } from "antd";
import AppHeader from "../components/AppHeader";

const { Title, Paragraph } = Typography;

export default function MaterialsPage() {
  const { section, id } = useParams(); // section id URLdan olinadi
  const navigate = useNavigate();

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ["materials", id],
    queryFn: () => getMaterialsBySection(id)
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

  return (
    <div>
      <AppHeader />
      <div className='p-6'>
        <Title className=' flex justify-center'>{section}</Title>
        <Row className='p-6' gutter={[16, 16]}>
          {materials.map((m, i) => (
            <Col key={m.id} onClick={() => handleCardClick(m.id)}>
              <Card hoverable>
                <Title level={5}>
                  {m.title.charAt(0).toUpperCase() + m.title.substring(1)}
                </Title>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
}
