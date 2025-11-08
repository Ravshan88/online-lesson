// src/pages/MaterialDetailPage.jsx
import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMaterialById } from "../api/materialsApi";
import { Card, Typography, Space, Button, Spin, Empty } from "antd";
import AppHeader from "../components/AppHeader";
import { DownloadOutlined } from "@ant-design/icons";
import axios from "axios";

const { Title, Text } = Typography;

export default function MaterialDetailPage() {
  const { section, id: sectionId, material_id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["material", material_id],
    queryFn: () => getMaterialById(material_id),
    retry: false
  });

  if (isLoading)
    return (
      <div className='flex justify-center items-center h-screen'>
        <Spin size='large' />
      </div>
    );

  if (isError || !data)
    return (
      <div className='p-6 text-center'>
        <Empty description='Material topilmadi' />
      </div>
    );

  const material = Array.isArray(data) ? data[0] : data;
  if (!material)
    return (
      <div className='p-6 text-center'>
        <Empty description='Material topilmadi' />
      </div>
    );

  const { id, title, pdf_path, video_url, tests = [] } = material;

  const handleOpenVideo = () => {
    if (!video_url) return;
    if (video_url.includes("youtube") || video_url.includes("youtu.be")) {
      window.open(video_url, "_blank");
    } else {
      const el = document.getElementById("material-video-player");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleOpenTests = () => {
    navigate(`/test/${id}`);
  };

  return (
    <div>
      <AppHeader />
      <div className='p-6 flex justify-center'>
        <Card className='border-r-2 w-full flex justify-center'>
          <Title level={2} className='flex justify-center'>
            {title.charAt(0).toUpperCase() + title.substring(1)}
          </Title>

          <Space direction='vertical' style={{ width: "900px" }} size='large'>
            <Card>
              <Title level={2}>📘 PDF ni ochish (kitob ko‘rinishida)</Title>
              <Button
                type='primary'
                icon={<DownloadOutlined />}
              >
                Yuklab olish
              </Button>
            </Card>

            <Link onClick={handleOpenVideo}>
              <Card>
                <Title level={2}>🎬 Video</Title>
              </Card>
            </Link>

            <Card>
              <Title level={2}>🧠 Testlar</Title>
              {tests && tests.length > 0 ? (
                <>
                  <Text>{tests.length} ta savol mavjud</Text>
                  <div style={{ marginTop: 12 }}>
                    <Button type='dashed' onClick={handleOpenTests}>
                      Testni yechish
                    </Button>
                  </div>
                </>
              ) : (
                <Text type='secondary'>Test mavjud emas</Text>
              )}
            </Card>
          </Space>
        </Card>
      </div>
    </div>
  );
}
