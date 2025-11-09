import React, { useState, useEffect } from "react";
import { Layout, Breadcrumb, Button } from "antd";
import { HomeOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import MaterialsTable from "../components/MaterialsTable";
import AppHeader from "../components/AppHeader";

const { Sider, Content } = Layout;

export default function AdminPage() {
  const navigate = useNavigate();
  const [selectedSection, setSelectedSection] = useState(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem("admin_selected_section");
    return saved ? Number(saved) : null;
  });

  useEffect(() => {
    if (selectedSection) {
      localStorage.setItem("admin_selected_section", String(selectedSection));
    } else {
      localStorage.removeItem("admin_selected_section");
    }
  }, [selectedSection]);

  return (
    <div>
      <AppHeader />
      <Layout style={{ minHeight: "calc(100vh - 64px)" }}>
        <Sider
          width={260}
          style={{ background: "#fff", borderRight: "1px solid #f0f0f0" }}
        >
          <AdminSidebar
            selectedSectionId={selectedSection}
            onSelect={setSelectedSection}
          />
        </Sider>

        <Layout>
          <Content style={{ padding: 24 }}>
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
                  title: "Admin panel"
                }
              ]}
            />
            {!selectedSection ? (
              <div style={{ padding: 40, textAlign: "center", color: "#666" }}>
                Iltimos bo'limni tanlang
              </div>
            ) : (
              <MaterialsTable sectionId={selectedSection} />
            )}
          </Content>
        </Layout>
      </Layout>
    </div>
  );
}
