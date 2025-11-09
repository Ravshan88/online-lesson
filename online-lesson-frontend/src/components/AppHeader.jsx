import React, { useEffect } from "react";
import { Layout, Avatar, Dropdown, Menu, Space, Typography, Spin, Button } from "antd";
import {
  UserOutlined,
  HomeOutlined,
  LogoutOutlined,
  DownOutlined,
  TrophyOutlined
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { userApi } from "../api/userApi";
import logo from "../assets/oxu.png";
const { Header } = Layout;
const { Text } = Typography;

const AppHeader = () => {
  const { data: user, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: () => userApi.me()
  });
  useEffect(() => {
    userApi.me();
  }, []);
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (isLoading) return <Spin />;

  const menu = (
    <Menu
      items={[
        {
          key: "home",
          label: (
            <a href='/home'>
              <HomeOutlined /> Home
            </a>
          )
        },
        {
          type: "divider"
        },
        {
          key: "logout",
          label: (
            <div onClick={logout}>
              <LogoutOutlined /> Log out
            </div>
          )
        }
      ]}
    />
  );

  return (
    <Header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "#012c6e",
        padding: "30px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
      }}
    >
      {/* Logo yoki sayt nomi */}
      <Link to={"/home"} style={{ width: "40px" }}>
        <img src={logo} alt='' />
      </Link>

      {/* Navigation and User info */}
      {/* User info va dropdown */}
      <Dropdown overlay={menu} trigger={["click"]}>
        <Space style={{ cursor: "pointer" }}>
          <Avatar
            style={{ backgroundColor: "#87d068" }}
            icon={<UserOutlined />}
          />
          <Text style={{ color: "white" }}>
            {user.firstname} {user.lastname}
          </Text>
          <DownOutlined style={{ color: "white" }} />
        </Space>
      </Dropdown>
    </Header>
  );
};

export default AppHeader;
