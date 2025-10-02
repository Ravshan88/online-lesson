import React from "react";
import { Form, Input, Button, Card, Col, Row, notification } from "antd";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { userApi } from "../api/userApi";

const LoginPage = () => {
  const navigate = useNavigate();

  const loginUser = useMutation({
    mutationFn: userApi.login,
    onSuccess: (data) => {
      // Backend token qaytarishi kerak
      localStorage.setItem("token", data.access_token);
      notification.success({
        message: "Xush kelibsiz!",
        description: "Siz tizimga muvaffaqiyatli kirdingiz."
      });
      navigate("/home");
    },
    onError: (error) => {
      notification.error({
        message: "Login xatosi!",
        description:
          error.response?.data?.detail || "Username yoki parol noto‘g‘ri"
      });
    }
  });

  const onFinish = (values) => {
    loginUser.mutate(values);
  };

  return (
    <div
      style={{ display: "flex", justifyContent: "center", marginTop: "50px" }}
    >
      <Card title='Login' style={{ width: 400 }}>
        <Form layout='vertical' onFinish={onFinish} autoComplete='off'>
          <Row style={{ width: "100%" }}>
            <Col xs={24}>
              <Form.Item
                label='Username'
                name='username'
                rules={[
                  { required: true, message: "Iltimos username kiriting!" }
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
                  { required: true, message: "Iltimos parolingizni kiriting!" }
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
                  loading={loginUser.isLoading}
                >
                  Kirish
                </Button>
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Button onClick={() => navigate("/register")} type='link'>
                Ro`yxatdan o`tish
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
