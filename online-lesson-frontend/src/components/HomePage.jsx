import React from "react";
import { Link } from "react-router-dom";
import { Card, List } from "antd";

const HomePage = () => {
  const links = [
    { name: "Maruza", path: "/maruza" },
    { name: "Amaliy", path: "/amaliy" },
    { name: "Tajriba", path: "/tajriba" },
    { name: "Mustaqil ish", path: "/mustaqil_ish" },
    { name: "Yakunlovchi Test", path: "/test" }
  ];

  return (
    <div
      style={{
        minHeight: "100vh"
      }}
    >
      <Card title='Welcome!' style={{ width: 400 }}>
        <List
          dataSource={links}
          renderItem={(item) => (
            <List.Item>
              <Link to={item.path}>{item.name}</Link>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default HomePage;
