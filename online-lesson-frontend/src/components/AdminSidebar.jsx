import React from "react";
import { Menu, Typography, Spin } from "antd";
import { useQuery } from "@tanstack/react-query";
import { getSections } from "../api/sectionsApi";

const { Title } = Typography;

export default function AdminSidebar({ selectedSectionId, onSelect }) {
  const { data: sections = [], isLoading } = useQuery({
    queryKey: ["sections"],
    queryFn: getSections
  });

  if (isLoading) {
    return (
      <div style={{ padding: 16, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  return (
    <div style={{ padding: 16, height: "100%", boxSizing: "border-box" }}>
      <Title level={5} style={{ marginBottom: 12 }}>
        Bo‘limlar
      </Title>

      <Menu
        mode='inline'
        selectedKeys={[String(selectedSectionId)]}
        style={{ borderRight: 0 }}
        onClick={({ key }) => onSelect(Number(key))}
      >
        {sections.map((s) => (
          <Menu.Item key={s.id}>{s.name}</Menu.Item>
        ))}
      </Menu>
    </div>
  );
}
