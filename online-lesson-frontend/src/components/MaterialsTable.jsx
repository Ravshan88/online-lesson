import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Upload,
  Popconfirm,
  Space,
  Tag,
  message
} from "antd";
import { UploadOutlined, PlusOutlined } from "@ant-design/icons";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import {
  getMaterialsBySection,
  createMaterial,
  updateMaterial,
  deleteMaterial
} from "../api/materialsApi";
import { useNavigate } from "react-router-dom";
export default function MaterialsTable({ sectionId }) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // material object when editing
  const [form] = Form.useForm();
  const [pdfFile, setPdfFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [hasVideoFile, SetHasVideoFile] = useState(null);
  const navigate = useNavigate();
  // load materials of section
  const { data: materials = [], isLoading } = useQuery({
    queryKey: ["materials", sectionId],
    queryFn: () => getMaterialsBySection(sectionId),
    enabled: !!sectionId
  });

  // mutations
  const createMut = useMutation({
    mutationFn: (formData) => createMaterial(formData),
    onSuccess: () => {
      queryClient.invalidateQueries(["materials", sectionId]);
      message.success("Material qoʻshildi");
      setIsModalOpen(false);
      form.resetFields();
      setPdfFile(null);
      setVideoFile(null);
    },
    onError: () => message.error("Xatolik, qayta urinib ko‘ring")
  });

  const updateMut = useMutation({
    mutationFn: ({ id, formData }) => updateMaterial(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries(["materials", sectionId]);
      message.success("Material yangilandi");
      setIsModalOpen(false);
      setEditing(null);
      form.resetFields();
      setPdfFile(null);
      setVideoFile(null);
    },
    onError: () => message.error("Xatolik, qayta urinib ko‘ring")
  });

  const deleteMut = useMutation({
    mutationFn: (id) => deleteMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["materials", sectionId]);
      message.success("Material oʻchirildi");
    },
    onError: () => message.error("Oʻchirishda xatolik")
  });

  useEffect(() => {
    if (!isModalOpen) {
      form.resetFields();
      setPdfFile(null);
      setVideoFile(null);
      setEditing(null);
      SetHasVideoFile(null);
    }
  }, [isModalOpen, form]);

  const openAddModal = () => {
    setEditing(null);
    setIsModalOpen(true);
  };

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
    if (youtubeLink) return { type: "youtube", url: youtubeLink.path };
    // Check for video file
    const videoFile = attachments.find(
      (att) =>
        att.type === "file" &&
        (att.path?.toLowerCase().endsWith(".mp4") ||
          att.path?.toLowerCase().endsWith(".avi") ||
          att.path?.toLowerCase().endsWith(".mov") ||
          att.path?.toLowerCase().endsWith(".mkv"))
    );
    if (videoFile) return { type: "file", path: videoFile.path };
    return null;
  };

  const openEditModal = (record) => {
    setEditing(record);
    const videoAtt = getVideoAttachment(record.attachments);
    form.setFieldsValue({
      title: record.title,
      video_type: videoAtt?.type || null,
      video_url: videoAtt?.type === "youtube" ? videoAtt.url : null
    });
    SetHasVideoFile(videoAtt?.type || null);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    deleteMut.mutate(id);
  };

  // file upload handlers: prevent auto upload and store file in state
  const beforePdfUpload = (file) => {
    setPdfFile(file);
    return false; // prevent auto upload
  };
  const beforeVideoUpload = (file) => {
    setVideoFile(file);
    return false;
  };

  const onFinish = (values) => {
    // build FormData
    const formData = new FormData();
    formData.append("section_id", sectionId);

    if (values.title) formData.append("title", values.title);

    if (values.video_type) formData.append("video_type", values.video_type);
    if (values.video_type === "youtube" && values.video_url) {
      formData.append("video_url", values.video_url);
    }

    if (pdfFile) {
      formData.append("pdf_file", pdfFile);
    }

    if (values.video_type === "file" && videoFile) {
      formData.append("video_file", videoFile);
    }

    // tests are optional when creating from admin (we skip here)

    if (editing) {
      // update
      updateMut.mutate({ id: editing.id, formData });
    } else {
      // create
      createMut.mutate(formData);
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 70
    },
    {
      title: "Title",
      dataIndex: "title",
      render: (t) => t || "—"
    },
    {
      title: "PDF",
      dataIndex: "attachments",
      render: (attachments) => {
        const pdfAtt = getPdfAttachment(attachments);
        return pdfAtt ? <Tag color='blue'>Yes</Tag> : <Tag>—</Tag>;
      },
      width: 100
    },
    {
      title: "Video",
      dataIndex: "attachments",
      render: (attachments) => {
        const videoAtt = getVideoAttachment(attachments);
        if (!videoAtt) return <Tag>—</Tag>;
        return (
          <Tag color={videoAtt.type === "youtube" ? "red" : "green"}>
            {videoAtt.type}
          </Tag>
        );
      },
      width: 120
    },
    {
      title: "Tests",
      dataIndex: "tests",
      render: (t) => <Tag>{t?.length ?? 0}</Tag>,
      width: 100
    },
    {
      title: "Amallar",
      key: "actions",
      render: (_, record) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            type='default'
            onClick={() => navigate(`/admin/material/${record.id}/tests`)}
          >
            🧠 Testlar
          </Button>
        </div>
      )
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_, record) => (
        <Space>
          <Button onClick={() => openEditModal(record)}>Edit</Button>
          <Popconfirm
            title='Oʻchirishni tasdiqlaysizmi?'
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger loading={deleteMut.isLoading}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 16 }}>
      <Space style={{ marginBottom: 12 }}>
        <Button type='primary' icon={<PlusOutlined />} onClick={openAddModal}>
          Add Material
        </Button>
      </Space>

      <Table
        rowKey='id'
        loading={isLoading}
        dataSource={materials}
        columns={columns}
        pagination={{ pageSize: 8 }}
      />

      <Modal
        title={editing ? "Edit Material" : "Add Material"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form layout='vertical' form={form} onFinish={onFinish}>
          <Form.Item
            name='title'
            label='Title'
            rules={[{ required: true, message: "Material nomini kiriting" }]}
          >
            <Input placeholder='Material nomi' />
          </Form.Item>

          <Form.Item
            name='pdf'
            label='PDF fayl'
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}
            rules={[
              {
                validator: (_, value) => {
                  if (pdfFile && (!value || value.length === 0)) {
                    return Promise.reject("File yuklang");
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Upload beforeUpload={beforePdfUpload} maxCount={1} accept='.pdf'>
              <Button icon={<UploadOutlined />}>PDF yuklash</Button>
            </Upload>
            {(() => {
              const pdfAtt = getPdfAttachment(editing?.attachments);
              return (
                pdfAtt &&
                !pdfFile && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
                    Hozirgi fayl: {pdfAtt.name}
                  </div>
                )
              );
            })()}
          </Form.Item>

          <Form.Item
            name='video_type'
            label='Video turi'
            rules={[{ required: true, message: "Video turini tanlang" }]}
          >
            <Select
              placeholder='Tanlang'
              onChange={(val) => {
                // reset video fields on change
                form.setFieldsValue({ video_url: undefined });
                setVideoFile(null);
                SetHasVideoFile(val);
              }}
            >
              <Select.Option value='youtube'>YouTube link</Select.Option>
              <Select.Option value='file'>Fayl (upload)</Select.Option>
            </Select>
          </Form.Item>

          {/* YouTube URL */}
          {hasVideoFile && (
            <Form.Item
              shouldUpdate={(prev, cur) => prev.video_type !== cur.video_type}
            >
              {() =>
                hasVideoFile === "youtube" ? (
                  <Form.Item
                    name='video_url'
                    label='YouTube URL'
                    rules={[
                      {
                        type: "url",
                        required: true,
                        message: "Vidoe manzilini kiriting"
                      }
                    ]}
                  >
                    <Input placeholder='https://www.youtube.com/watch?v=...' />
                  </Form.Item>
                ) : hasVideoFile === "file" ? (
                  <Form.Item
                    name='video_file'
                    label='Video fayl'
                    getValueFromEvent={(e) =>
                      Array.isArray(e) ? e : e && e.fileList
                    }
                    rules={[
                      {
                        validator: (_, value) => {
                          if (
                            hasVideoFile === "file" &&
                            (!value || value.length === 0)
                          ) {
                            return Promise.reject("Video yuklang");
                          }
                          return Promise.resolve();
                        }
                      }
                    ]}
                  >
                    <Upload
                      beforeUpload={beforeVideoUpload}
                      maxCount={1}
                      accept='video/*'
                      customRequest={({ onSuccess }) =>
                        setTimeout(() => onSuccess("ok"), 0)
                      } // fake upload
                    >
                      <Button icon={<UploadOutlined />}>Video yuklash</Button>
                    </Upload>
                    {(() => {
                      const videoAtt = getVideoAttachment(editing?.attachments);
                      return (
                        videoAtt &&
                        videoAtt.type === "file" &&
                        !videoFile && (
                          <div
                            style={{
                              marginTop: 8,
                              fontSize: 12,
                              color: "#666"
                            }}
                          >
                            Hozirgi video: {videoAtt.path}
                          </div>
                        )
                      );
                    })()}
                  </Form.Item>
                ) : null
              }
            </Form.Item>
          )}

          <Form.Item>
            <Space>
              <Button
                htmlType='submit'
                type='primary'
                loading={createMut.isLoading || updateMut.isLoading}
              >
                {editing ? "Save" : "Create"}
              </Button>
              <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
