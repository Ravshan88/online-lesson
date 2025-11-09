import React, { useState } from "react";
import { Layout } from "antd";
import AdminSidebar from "../components/AdminSidebar";
import MaterialsTable from "../components/MaterialsTable";
import AppHeader from "../components/AppHeader";

const { Sider, Content } = Layout;

export default function AdminPage() {
  const [selectedSection, setSelectedSection] = useState(null);

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
            {!selectedSection ? (
              <div style={{ padding: 40, textAlign: "center", color: "#666" }}>
                Iltimos bo‘limni chapdan tanlang
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
