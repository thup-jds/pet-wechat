import { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, Card, message, Divider } from "antd";
import { PlusOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { api } from "../api/client";
import dayjs from "dayjs";

export default function EventsPage() {
  const [data, setData] = useState<any[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [collars, setCollars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualOpen, setManualOpen] = useState(false);
  const [autoOpen, setAutoOpen] = useState(false);
  const [manualForm] = Form.useForm();
  const [autoForm] = Form.useForm();

  const load = () => {
    setLoading(true);
    Promise.all([api.getBehaviors(100), api.getPets(), api.getCollars()]).then(([b, p, c]) => {
      setData(b.behaviors);
      setPets(p.pets);
      setCollars(c.collars);
    }).catch((e) => message.error(e.message)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleManual = async () => {
    try {
      const values = await manualForm.validateFields();
      await api.createBehavior(values);
      message.success("事件创建成功");
      setManualOpen(false);
      manualForm.resetFields();
      load();
    } catch (e: any) {
      if (e.message) message.error(e.message);
    }
  };

  const handleAuto = async () => {
    try {
      const values = await autoForm.validateFields();
      const result = await api.autoBehaviors(values);
      message.success(`成功生成 ${result.count} 条事件`);
      setAutoOpen(false);
      autoForm.resetFields();
      load();
    } catch (e: any) {
      if (e.message) message.error(e.message);
    }
  };

  const actionTypes = [
    { value: "walking", label: "散步" },
    { value: "running", label: "奔跑" },
    { value: "sleeping", label: "睡觉" },
    { value: "eating", label: "吃东西" },
    { value: "playing", label: "玩耍" },
    { value: "resting", label: "休息" },
    { value: "jumping", label: "跳跃" },
  ];

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 200, ellipsis: true },
    { title: "宠物", dataIndex: "petName", key: "petName", render: (v: string | null) => v ?? "-" },
    { title: "项圈", dataIndex: "collarName", key: "collarName", render: (v: string | null) => v ?? "-" },
    { title: "行为类型", dataIndex: "actionType", key: "actionType" },
    {
      title: "时间",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 180,
      render: (v: string) => dayjs(v).format("YYYY-MM-DD HH:mm:ss"),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>模拟事件</h2>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { manualForm.resetFields(); setManualOpen(true); }}>
            手动创建
          </Button>
          <Button icon={<ThunderboltOutlined />} onClick={() => { autoForm.resetFields(); setAutoOpen(true); }}>
            批量生成
          </Button>
        </Space>
      </div>

      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} size="middle" />

      {/* 手动创建弹窗 */}
      <Modal title="手动创建事件" open={manualOpen} onOk={handleManual} onCancel={() => setManualOpen(false)}>
        <Form form={manualForm} layout="vertical">
          <Form.Item name="petId" label="宠物" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={pets.map((p) => ({ value: p.id, label: `${p.name} (${p.id.slice(0, 8)}...)` }))}
            />
          </Form.Item>
          <Form.Item name="collarDeviceId" label="项圈" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={collars.map((c) => ({ value: c.id, label: `${c.name} (${c.macAddress})` }))}
            />
          </Form.Item>
          <Form.Item name="actionType" label="行为类型" rules={[{ required: true }]}>
            <Select options={actionTypes} />
          </Form.Item>
          <Form.Item name="timestamp" label="时间">
            <Input placeholder="留空为当前时间，格式: YYYY-MM-DDTHH:mm:ss" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量生成弹窗 */}
      <Modal title="批量生成随机事件" open={autoOpen} onOk={handleAuto} onCancel={() => setAutoOpen(false)}>
        <Form form={autoForm} layout="vertical">
          <Form.Item name="petId" label="宠物" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={pets.map((p) => ({ value: p.id, label: `${p.name} (${p.id.slice(0, 8)}...)` }))}
            />
          </Form.Item>
          <Form.Item name="collarDeviceId" label="项圈" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={collars.map((c) => ({ value: c.id, label: `${c.name} (${c.macAddress})` }))}
            />
          </Form.Item>
          <Form.Item name="count" label="生成数量" initialValue={10}>
            <InputNumber min={1} max={100} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="intervalMinutes" label="事件间隔 (分钟)" initialValue={30}>
            <InputNumber min={1} max={1440} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
