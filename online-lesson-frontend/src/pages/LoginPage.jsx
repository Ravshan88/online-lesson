import React from "react";
import { Form, Input, Button, Card, Col, Row, notification } from "antd";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { userApi } from "../api/userApi";
import { jwtDecode } from "jwt-decode";

const LoginPage = () => {
  const navigate = useNavigate();

  const loginUser = useMutation({
    mutationFn: userApi.login,
    onSuccess: async (data) => {
      // Store token with standardized name
      localStorage.setItem("access_token", data.access_token);
      // Keep backward compatibility
      localStorage.setItem("token", data.access_token);

      // Check user role from token
      try {
        const decoded = jwtDecode(data.access_token);
        const userRole = decoded.role;

        notification.success({
          message: "Xush kelibsiz!",
          description: "Siz tizimga muvaffaqiyatli kirdingiz."
        });

        // Navigate based on role
        if (userRole === "admin") {
          navigate("/admin");
        } else {
          navigate("/home");
        }
      } catch (error) {
        // If token decode fails, default to home
        navigate("/home");
      }
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
                  loading={loginUser.isPending}
                >
                  Kirish
                </Button>
              </Form.Item>
            </Col>

            <div className='m-auto'>
              <Button onClick={() => navigate("/register")} type='link'>
                Ro`yxatdan o`tish
              </Button>
            </div>
          </Row>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
