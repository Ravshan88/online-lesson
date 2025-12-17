import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Input,
  Form,
  Space,
  message,
  Popconfirm,
  Breadcrumb
} from "antd";
import { useParams, useNavigate } from "react-router-dom";
import { HomeOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import axiosClient from "../api/axiosClient";

export default function MaterialTestsPage() {
  const { id, title } = useParams();
  const [tests, setTests] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const fetchTests = async () => {
    try {
      // const res = await axios.get(`http://localhost:8000/tests/material/${id}`);
      const res = await axiosClient.get(`/tests/material/${id}`)
      setTests(res.data);
    } catch (err) {
      console.error(err);
      message.error("Testlarni yuklashda xatolik!");
    }
  };

  useEffect(() => {
    fetchTests();
  }, [id]);

  const handleAddOrEditTest = async (values) => {
    try {
      const formatted = {
        ...values,
        material_id: id,
        options: values.options.map((opt) => opt.option)
      };

      if (editingTest) {
        await axiosClient.put(
          `/tests/${editingTest.id}`,
          formatted
        );
        message.success("Test yangilandi!");
      } else {
        await axiosClient.post("/tests/", formatted);
        message.success("Test qo‘shildi!");
      }

      setIsModalVisible(false);
      setEditingTest(null);
      form.resetFields();
      fetchTests();
    } catch (err) {
      console.error(err);
      message.error("Saqlashda xatolik yuz berdi!");
    }
  };

  const handleEdit = (test) => {
    setEditingTest(test);
    setIsModalVisible(true);
    form.setFieldsValue({
      question: test.question,
      correct_answer: test.correct_answer,
      options: test.options.map((opt) => ({ option: opt }))
    });
  };

  const handleDelete = async (testId) => {
    try {
      await axiosClient.delete(`/tests/${testId}`);
      message.success("Test o‘chirildi!");
      fetchTests();
    } catch (err) {
      console.error(err);
      message.error("O‘chirishda xatolik!");
    }
  };

  const columns = [
    { title: "Savol", dataIndex: "question" },
    {
      title: "Variantlar",
      dataIndex: "options",
      render: (opts) => opts.join(", ")
    },
    { title: "To‘g‘ri javob", dataIndex: "correct_answer" },
    {
      title: "Amallar",
      render: (_, record) => (
        <Space>
          <Button type='link' onClick={() => handleEdit(record)}>
            Tahrirlash
          </Button>
          <Popconfirm
            title='Testni o‘chirmoqchimisiz?'
            onConfirm={() => handleDelete(record.id)}
            okText='Ha'
            cancelText='Yo‘q'
          >
            <Button type='link' danger>
              O‘chirish
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>{title} uchun testlar</h2>
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
            title: <a href='/admin'>Admin panel</a>
          },
          {
            title: `${title}`
          }
        ]}
      />
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
          Orqaga
        </Button>
      </div>
      <Button
        type='primary'
        onClick={() => {
          setEditingTest(null);
          setIsModalVisible(true);
          form.resetFields();
        }}
      >
        + Test qo‘shish
      </Button>

      <Table
        dataSource={tests}
        columns={columns}
        rowKey='id'
        style={{ marginTop: 16 }}
      />

      <Modal
        title={editingTest ? "Testni tahrirlash" : "Yangi test qo‘shish"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingTest(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText='Saqlash'
      >
        <Form form={form} layout='vertical' onFinish={handleAddOrEditTest}>
          <Form.Item
            label='Savol'
            name='question'
            rules={[{ required: true, message: "Savol kiritilishi kerak!" }]}
          >
            <Input />
          </Form.Item>

          {/* OPTIONS LIST */}
          <Form.List
            name='options'
            rules={[
              {
                validator: async (_, options) => {
                  if (!options || options.length < 2) {
                    return Promise.reject(
                      new Error("Kamida 2 ta variant bo‘lishi kerak!")
                    );
                  }
                }
              }
            ]}
          >
            {(fields, { add, remove }) => (
              <>
                <label>Variantlar:</label>
                {fields.map((field) => (
                  <Space
                    key={field.key}
                    style={{ display: "flex", marginBottom: 8 }}
                    align='baseline'
                  >
                    <Form.Item
                      {...field}
                      name={[field.name, "option"]}
                      rules={[{ required: true, message: "Variant kiriting!" }]}
                    >
                      <Input placeholder='Variant' />
                    </Form.Item>
                    <Button danger onClick={() => remove(field.name)}>
                      O‘chirish
                    </Button>
                  </Space>
                ))}
                <Form.Item>
                  <Button type='dashed' onClick={() => add()} block>
                    + Variant qo‘shish
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item
            label='To‘g‘ri javob'
            name='correct_answer'
            rules={[
              { required: true, message: "To‘g‘ri javob kiritilishi kerak!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const options = getFieldValue("options")?.map((o) =>
                    o.option.trim()
                  );
                  if (!value) return Promise.reject();
                  if (!options?.includes(value.trim())) {
                    return Promise.reject(
                      new Error(
                        "To‘g‘ri javob variantlardan biriga teng bo‘lishi kerak!"
                      )
                    );
                  }
                  return Promise.resolve();
                }
              })
            ]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
