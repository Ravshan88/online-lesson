import React from "react";
import { Layout, Avatar, Dropdown, Menu, Space, Typography } from "antd";
import {
  UserOutlined,
  HomeOutlined,
  LogoutOutlined,
  DownOutlined
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/oxu.png";
const { Header } = Layout;
const { Text } = Typography;

const AppHeader = () => {
  const user = {
    name: "Ravshan Kamoliddinov",
    avatar: <Avatar size={32} icon={<UserOutlined />} />
  };
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

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

      {/* User info va dropdown */}
      <Dropdown overlay={menu} trigger={["click"]}>
        <Space style={{ cursor: "pointer" }}>
          <Avatar
            style={{ backgroundColor: "white" }}
            src={user.avatar}
            icon={<UserOutlined />}
          />
          <Text style={{ color: "white" }}>{user.name}</Text>
          <DownOutlined style={{ color: "white" }} />
        </Space>
      </Dropdown>
    </Header>
  );
};

export default AppHeader;
