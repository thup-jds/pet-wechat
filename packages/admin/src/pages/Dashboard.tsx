import { useEffect, useState } from "react";
import { Card, Col, Row, Statistic } from "antd";
import {
  UserOutlined,
  HeartOutlined,
  ApiOutlined,
  DesktopOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { api } from "../api/client";

export default function Dashboard() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStats().then(setStats).finally(() => setLoading(false));
  }, []);

  const items = [
    { title: "用户", key: "users", icon: <UserOutlined />, color: "#1890ff" },
    { title: "宠物", key: "pets", icon: <HeartOutlined />, color: "#eb2f96" },
    { title: "项圈", key: "collars", icon: <ApiOutlined />, color: "#52c41a" },
    { title: "摆台", key: "desktops", icon: <DesktopOutlined />, color: "#722ed1" },
    { title: "行为事件", key: "behaviors", icon: <ThunderboltOutlined />, color: "#fa8c16" },
  ];

  return (
    <Row gutter={[16, 16]}>
      {items.map((item) => (
        <Col xs={24} sm={12} md={8} lg={4} key={item.key}>
          <Card loading={loading}>
            <Statistic
              title={item.title}
              value={stats[item.key] ?? 0}
              prefix={item.icon}
              valueStyle={{ color: item.color }}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
}
