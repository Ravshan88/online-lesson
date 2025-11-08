import { useQuery } from "@tanstack/react-query";
import { getSections } from "../api/sectionsApi";
import { Card, Row, Col, Typography, Tag, Spin } from "antd";
import { Link } from "react-router-dom";
import AppHeader from "../components/AppHeader";

const { Title } = Typography;

export default function HomePage() {
  // React Query bilan sectionsni olish
  const { data: sections = [], isLoading } = useQuery({
    queryKey: ["sections"],
    queryFn: getSections
  });

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <Spin size='large' />
      </div>
    );
  }

  return (
    <>
      <AppHeader />
      <div style={{padding:"50px"}}>
        <Row gutter={[16, 16]}>
          {sections.map((s) => (
            <Col key={s.id} xs={24} sm={12} md={6}>
              <Link to={`/${s.name}/${s.id}`}>
                <Card hoverable>
                  <Title level={4} style={{ marginBottom: 8 }}>
                    {s.name.toUpperCase()}
                  </Title>
                  <Tag color='blue'>{s.materials} ta</Tag>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      </div>
    </>
  );
}
