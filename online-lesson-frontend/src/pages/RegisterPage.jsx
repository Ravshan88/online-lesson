import React from "react";
import { Form, Input, Button, Card, Col, Row, notification } from "antd";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import userApi from "../api/userApi";

const RegisterPage = () => {
  const navigate = useNavigate();
  // mutation
  const registerUser = useMutation({
    mutationFn: userApi.register,
    onSuccess: () => {
      notification.success({
        message: "Muvaffaqiyatli!",
        description: "Ro‘yxatdan o‘tish yakunlandi. Endi login qiling."
      });
      navigate("/login");
    },
    onError: (error) => {
      console.log(error);

      notification.error({
        message: "Xatolik!",
        description:
          error.response?.data?.detail || "Noma’lum xatolik yuz berdi"
      });
    }
  });

  const onFinish = (values) => {
    registerUser.mutate(values);
  };

  return (
    <div
      style={{ display: "flex", justifyContent: "center", marginTop: "50px" }}
    >
      <Card title='Ro`yxatdan o`tish' style={{ width: 400 }}>
        <Form layout='vertical' onFinish={onFinish} autoComplete='off'>
          <Row style={{ width: "100%" }}>
            <Col xs={24}>
              <Form.Item
                label='Ism'
                name='firstname'
                rules={[
                  { required: true, message: "Itimos ismingizni kiriting!" }
                ]}
              >
                <Input />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                label='Familiya'
                name='lastname'
                rules={[
                  { required: true, message: "Itimos familiyangizni kiriting!" }
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                label='Fakultet'
                name='faculty'
                rules={[
                  { required: true, message: "Itimos fakultetni kiriting!" }
                ]}
              >
                <Input />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                label='Yo‘nalish'
                name='direction'
                rules={[
                  { required: true, message: "Itimos yo‘nalishni kiriting!" }
                ]}
              >
                <Input />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                label='Username'
                name='username'
                rules={[
                  { required: true, message: "Itimos username kiriting!" }
                ]}
              >
                <Input />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                label='Parol'
                name='password'
                rules={[
                  { required: true, message: "Itimos parolingizni kiriting!" }
                ]}
              >
                <Input.Password />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item>
                <Button
                  type='primary'
                  htmlType='submit'
                  block
                  loading={registerUser.isPending}
                >
                  Ro`yxatdan o`tish
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
};

export default RegisterPage;
