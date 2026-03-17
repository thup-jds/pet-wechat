import { useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu, Typography, Modal, Input, Button, Space } from "antd";
import {
  UserOutlined,
  HeartOutlined,
  ApiOutlined,
  DesktopOutlined,
  ThunderboltOutlined,
  DashboardOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { getAdminKey, setAdminKey } from "./api/client";
import Dashboard from "./pages/Dashboard";
import UsersPage from "./pages/Users";
import PetsPage from "./pages/Pets";
import CollarsPage from "./pages/Collars";
import DesktopsPage from "./pages/Desktops";
import EventsPage from "./pages/Events";

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: "/", icon: <DashboardOutlined />, label: "概览" },
  { key: "/users", icon: <UserOutlined />, label: "用户" },
  { key: "/pets", icon: <HeartOutlined />, label: "宠物" },
  { key: "/collars", icon: <ApiOutlined />, label: "项圈" },
  { key: "/desktops", icon: <DesktopOutlined />, label: "桌面摆台" },
  { key: "/events", icon: <ThunderboltOutlined />, label: "模拟事件" },
];

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [keyInput, setKeyInput] = useState(getAdminKey());

  const handleSaveKey = () => {
    setAdminKey(keyInput);
    setKeyModalOpen(false);
    window.location.reload();
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ height: 32, margin: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Typography.Text strong style={{ color: "#fff", fontSize: collapsed ? 14 : 16 }}>
            {collapsed ? "YH" : "YEHEY 管理后台"}
          </Typography.Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: "#fff", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            YEHEY 宠物"在场" - 管理后台
          </Typography.Title>
          <Button
            icon={<SettingOutlined />}
            size="small"
            onClick={() => { setKeyInput(getAdminKey()); setKeyModalOpen(true); }}
          >
            Admin Key
          </Button>
        </Header>
        <Content style={{ margin: 24 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/pets" element={<PetsPage />} />
            <Route path="/collars" element={<CollarsPage />} />
            <Route path="/desktops" element={<DesktopsPage />} />
            <Route path="/events" element={<EventsPage />} />
          </Routes>
        </Content>
      </Layout>

      <Modal
        title="设置 Admin Key"
        open={keyModalOpen}
        onOk={handleSaveKey}
        onCancel={() => setKeyModalOpen(false)}
      >
        <Input.Password
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          placeholder="输入 Admin Key"
        />
      </Modal>
    </Layout>
  );
}
