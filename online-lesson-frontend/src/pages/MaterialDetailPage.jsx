// src/pages/MaterialDetailPage.jsx
import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMaterialById } from "../api/materialsApi";
import {
  getMaterialProgress,
  markAttachmentComplete
} from "../api/progressApi";
import {
  Card,
  Typography,
  Space,
  Button,
  Spin,
  Empty,
  Checkbox,
  Progress as AntProgress,
  message,
  Progress,
  Breadcrumb
} from "antd";
import AppHeader from "../components/AppHeader";
import {
  DownloadOutlined,
  ArrowLeftOutlined,
  HomeOutlined
} from "@ant-design/icons";

const { Title, Text } = Typography;

export default function MaterialDetailPage() {
  const { section, id: sectionId, material_id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["material", material_id],
    queryFn: () => getMaterialById(material_id),
    retry: false
  });

  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ["progress", material_id],
    queryFn: () => getMaterialProgress(material_id),
    enabled: !!material_id,
    retry: false
  });

  const markCompleteMutation = useMutation({
    mutationFn: markAttachmentComplete,
    onSuccess: () => {
      queryClient.invalidateQueries(["progress", material_id]);
      message.success("Progress yangilandi");
    },
    onError: () => {
      message.error("Progress yangilashda xatolik");
    }
  });

  if (isLoading || progressLoading)
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
    if (youtubeLink)
      return { type: "youtube", url: youtubeLink.path, id: youtubeLink.id };
    // Check for video file
    const videoFile = attachments.find(
      (att) =>
        att.type === "file" &&
        (att.path?.toLowerCase().endsWith(".mp4") ||
          att.path?.toLowerCase().endsWith(".avi") ||
          att.path?.toLowerCase().endsWith(".mov") ||
          att.path?.toLowerCase().endsWith(".mkv"))
    );
    if (videoFile)
      return { type: "file", path: videoFile.path, id: videoFile.id };
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

  const handleDownloadFile = (attachmentId) => {
    const url = "http://localhost:8000"
    // const url = import.meta.env.VITE_API_URL
    // Use the get_file endpoint for any file type
    window.open(
      `${url}/materials/get_file/${attachmentId}`,
      "_blank"
    );
  };

  const handleDownloadPdf = () => {
    if (!pdfAttachment) return;
    // Use the get_file endpoint
    handleDownloadFile(pdfAttachment.id);
    // Mark as completed when downloaded
    if (pdfAttachment.id) {
      markCompleteMutation.mutate(pdfAttachment.id);
    }
  };

  const handleOpenVideo = (attachmentId) => {
    if (!videoAttachment) return;
    if (videoAttachment.type === "youtube") {
      window.open(videoAttachment.url, "_blank");
    } else {
      handleDownloadFile(attachmentId);
    }
    // Mark as completed when viewed/downloaded
    if (attachmentId) {
      markCompleteMutation.mutate(attachmentId);
    }
  };

  const handleVideoCheckbox = (e) => {
    if (e.target.checked && videoAttachment?.id) {
      markCompleteMutation.mutate(videoAttachment.id);
    }
  };

  const handlePdfCheckbox = (e) => {
    if (e.target.checked && pdfAttachment?.id) {
      markCompleteMutation.mutate(pdfAttachment.id);
    }
  };

  const handleOpenTests = () => {
    navigate(`/test/${id}`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div>
      <AppHeader />
      <div className='p-6 flex justify-center'>
        <Card className='border-r-2 w-full flex justify-center'>
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
                    {section}
                  </a>
                )
              },
              {
                title: title.charAt(0).toUpperCase() + title.substring(1)
              }
            ]}
          />
          <div style={{ marginBottom: 16 }}>
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
              Orqaga
            </Button>
          </div>
          <Title level={2} className='flex justify-center'>
            {title.charAt(0).toUpperCase() + title.substring(1)}
          </Title>

          {progress && (
            <Card style={{ marginBottom: 16 }}>
              <Title level={4}>Progress</Title>
              <AntProgress
                percent={progress.percentage}
                status={progress.percentage === 100 ? "success" : "active"}
              />
              <Text type='secondary' style={{ display: "block", marginTop: 8 }}>
                {progress.completed_tests} / {progress.total_tests} test
                yechildi
              </Text>
            </Card>
          )}

          <Space direction='vertical' style={{ width: "900px" }} size='large'>
            {pdfAttachment && (
              <Card>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <Title level={2}>📘 PDF</Title>
                    <Button
                      type='primary'
                      icon={<DownloadOutlined />}
                      onClick={handleDownloadPdf}
                      style={{ marginTop: 8 }}
                    >
                      Yuklab olish
                    </Button>
                  </div>
                  {progress?.pdf_completed && (
                    <Progress
                      type='circle'
                      percent={progress?.pdf_completed ? 100 : 0}
                      size={40}
                    />
                  )}
                </div>
              </Card>
            )}

            {videoAttachment && (
              <Card>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <Title level={2}>🎬 Video</Title>
                    <Space style={{ marginTop: 8 }}>
                      {videoAttachment.type === "youtube" ? (
                        <Button
                          type='primary'
                          onClick={() => handleOpenVideo(videoAttachment.id)}
                        >
                          Videoni ko'rish
                        </Button>
                      ) : (
                        <Button
                          type='primary'
                          icon={<DownloadOutlined />}
                          onClick={() => handleOpenVideo(videoAttachment.id)}
                        >
                          Yuklab olish
                        </Button>
                      )}
                    </Space>
                  </div>
                  {progress?.video_completed && (
                    <>
                      <Progress
                        type='circle'
                        percent={progress?.video_completed ? 100 : 0}
                        size={40}
                      />
                    </>
                  )}
                </div>
              </Card>
            )}

            <Card>
              <Title level={2}>🧠 Testlar</Title>
              {tests && tests.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <Text>
                      {progress?.completed_tests || 0} / {tests.length} ta test
                      yechildi
                    </Text>
                    <div style={{ marginTop: 12 }}>
                      <Button type='dashed' onClick={handleOpenTests}>
                        Testni yechish
                      </Button>
                    </div>
                  </div>
                  {progress?.completed_tests ? (
                    <>
                      <Progress
                        type='circle'
                        percent={progress?.completed_tests ? 100 : 0}
                        size={40}
                      />
                    </>
                  ) : (
                    ""
                  )}
                </div>
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
