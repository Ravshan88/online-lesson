// src/pages/MaterialDetailPage.jsx
import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMaterialById } from "../api/materialsApi";
import { Card, Typography, Space, Button, Spin, Empty } from "antd";
import AppHeader from "../components/AppHeader";
import { DownloadOutlined } from "@ant-design/icons";

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

  const { id, title, attachments = [], tests = [] } = material;

  // Helper functions to extract attachments
  const getPdfAttachment = (attachments) => {
    if (!attachments || !Array.isArray(attachments)) return null;
    return attachments.find(
      (att) => att.type === "file" && att.path?.toLowerCase().endsWith(".pdf")
    );
  };

  const getVideoAttachment = (attachments) => {
    if (!attachments || !Array.isArray(attachments)) return null;
    // Check for YouTube link
    const youtubeLink = attachments.find((att) => att.type === "link");
    if (youtubeLink) return { type: "youtube", url: youtubeLink.path, id: youtubeLink.id };
    // Check for video file
    const videoFile = attachments.find(
      (att) =>
        att.type === "file" &&
        (att.path?.toLowerCase().endsWith(".mp4") ||
          att.path?.toLowerCase().endsWith(".avi") ||
          att.path?.toLowerCase().endsWith(".mov") ||
          att.path?.toLowerCase().endsWith(".mkv"))
    );
    if (videoFile) return { type: "file", path: videoFile.path, id: videoFile.id };
    return null;
  };

  const pdfAttachment = getPdfAttachment(attachments);
  const videoAttachment = getVideoAttachment(attachments);

  // Get all file attachments (not just PDFs)
  const getAllFileAttachments = (attachments) => {
    if (!attachments || !Array.isArray(attachments)) return [];
    return attachments.filter((att) => att.type === "file");
  };

  const fileAttachments = getAllFileAttachments(attachments);

  const handleOpenVideo = (attachmentId) => {
    if (!videoAttachment) return;
    if (videoAttachment.type === "youtube") {
      window.open(videoAttachment.url, "_blank");
    } else {
      console.log(attachmentId);
      
    }
  };

  const handleDownloadFile = (attachmentId) => {
    // Use the get_file endpoint for any file type
    window.open(
      `http://localhost:8000/materials/get_file/${attachmentId}`,
      "_blank"
    );
  };

  const handleDownloadPdf = () => {
    if (!pdfAttachment) return;
    // Use the get_file endpoint
    handleDownloadFile(pdfAttachment.id);
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
            {pdfAttachment && (
              <Card>
                <Title level={2}>📘 PDF ni ochish (kitob ko‘rinishida)</Title>
                <Button
                  type='primary'
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadPdf}
                >
                  Yuklab olish
                </Button>
              </Card>
            )}

            {videoAttachment && (
              <Link onClick={()=>handleOpenVideo(videoAttachment.id)}>
                <Card>
                  <Title level={2}>🎬 Video</Title>
                  <Button
                    type='primary'
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownloadFile(videoAttachment.id)}
                  >
                    Yuklab olish
                  </Button>
                </Card>
              </Link>
            )}

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
