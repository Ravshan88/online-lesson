import React from "react";
import { Result, Button } from "antd";
import { useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div>
      <AppHeader />
      <Result
        status='404'
        title='404'
        subTitle='Kechirasiz, siz qidirayotgan sahifa topilmadi.'
        extra={
          <Button type='primary' onClick={() => navigate("/home")}>
            Bosh sahifaga qaytish
          </Button>
        }
      />
    </div>
  );
}
