import React, { useEffect } from "react";
import {
  Layout,
  Avatar,
  Dropdown,
  Menu,
  Space,
  Typography,
  Spin,
  Button
} from "antd";
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
    navigate("/login");
  };

  if (isLoading) return <Spin />;

  const menu = (
    <Menu
      items={[
        {
          key: "home",
          label: (
            <Link to='/home'>
              <HomeOutlined /> Home
            </Link>
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
        padding: "50px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
      }}
    >
      {/* Logo yoki sayt nomi */}
      <Link to={"/home"} style={{ width: "50px" }}>
        <img src={logo} alt='' />
      </Link>

      {/* Desktop title (faqat md dan katta ekranlarda) */}
      <p className='hidden font-bold md:block text-white text-xl text-center font-medium max-w-[800px]'>
        Kredit-modul tizimida fizika fanidan mustaqil ta`limni tashkil etish
        metodikasini takomillashtirish-web ilovasi
      </p>

      {/* Mobile title (faqat kichik ekranlarda) */}
      <p className='block md:hidden text-white text-base text-center font-medium'>
        Fizika mustaqil ta'lim
      </p>

      <Dropdown overlay={menu} trigger={["click"]}>
        <Space className='cursor-pointer select-none'>
          <Avatar className='bg-green-400' icon={<UserOutlined />} />

          <div className='text-white font-medium'>
            <span>{user.firstname}</span>

            <span className='hidden md:inline ml-1'>{user.lastname}</span>
          </div>

          <DownOutlined className='text-white hidden md:inline' />
        </Space>
      </Dropdown>
    </Header>
  );
};

export default AppHeader;
