import { useQuery } from "@tanstack/react-query";
import { getSections } from "../api/sectionsApi";
import { Card, Row, Col, Typography, Tag, Spin } from "antd";
import { Link, useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";

const { Title } = Typography;

export default function HomePage() {
  const navigate = useNavigate();
  
  // React Query bilan sectionsni olish
  const { data: sections = [], isLoading } = useQuery({
    queryKey: ["sections"],
    queryFn: getSections
  });

  const handleSectionClick = (section) => {
    // If it's "Yakuniy Test" section, redirect to random test page
    if (section.name === "Yakuniy Test") {
      navigate("/random-test");
    } else {
      navigate(`/${section.name}/${section.id}`);
    }
  };

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
              <Card 
                hoverable 
                onClick={() => handleSectionClick(s)}
                style={{ cursor: "pointer" }}
              >
                <Title level={4} style={{ marginBottom: 8 }}>
                  {s.name.toUpperCase()}
                </Title>
                {s.name === "Yakuniy Test" ? (
                  <Tag color='gold'>Test</Tag>
                ) : (
                  <Tag color='blue'>{s.materials} ta</Tag>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </>
  );
}
