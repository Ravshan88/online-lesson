import React, { useState } from "react";
import { Input, Button, Form, Card } from "antd";

const TestForm = ({ onSubmit }) => {
  const [form] = Form.useForm();
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(null);

  const handleOptionChange = (value, index) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = () => {
    if (correctIndex === null) {
      alert("Iltimos, to‘g‘ri javobni belgilang!");
      return;
    }
    const values = form.getFieldsValue();
    onSubmit({
      ...values,
      options,
      correct_answer: options[correctIndex],
    });
    form.resetFields();
    setOptions(["", "", "", ""]);
    setCorrectIndex(null);
  };

  return (
    <Card title="Test yaratish" style={{ maxWidth: 600, margin: "auto" }}>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="Savol matni"
          name="question"
          rules={[{ required: true, message: "Savolni kiriting!" }]}
        >
          <Input placeholder="Masalan: Quyosh tizimidagi eng katta sayyora qaysi?" />
        </Form.Item>

        {options.map((opt, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 10,
              gap: 8,
            }}
          >
            <Button
              type={correctIndex === i ? "primary" : "default"}
              onClick={() => setCorrectIndex(i)}
              style={{
                width: 40,
                background: correctIndex === i ? "#52c41a" : "",
                color: correctIndex === i ? "white" : "",
              }}
            >
              {String.fromCharCode(65 + i)}
            </Button>
            <Input
              value={opt}
              onChange={(e) => handleOptionChange(e.target.value, i)}
              placeholder={`Variant ${String.fromCharCode(65 + i)}`}
            />
          </div>
        ))}

        <Button type="primary" htmlType="submit" style={{ marginTop: 16 }}>
          Saqlash
        </Button>
      </Form>
    </Card>
  );
};

export default TestForm;
