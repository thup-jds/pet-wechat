import { View, Text, Input } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState } from "react";
import NavBar from "../../components/NavBar";
import { request } from "../../utils/request";
import "./index.scss";

export default function DesktopBind() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // TODO: 接入真实蓝牙搜索桌面端设备
  const handleBind = async () => {
    if (!name.trim()) {
      Taro.showToast({ title: "请输入设备名称", icon: "none" });
      return;
    }
    setLoading(true);
    try {
      await request({
        url: "/api/devices/desktops",
        method: "POST",
        data: {
          name: name.trim(),
          macAddress: `desktop_mock_${Date.now()}`,
        },
      });
      Taro.showToast({ title: "绑定成功", icon: "success" });
      setTimeout(() => {
        Taro.navigateTo({ url: "/pages/desktop-pair/index" });
      }, 1000);
    } catch (e: any) {
      Taro.showToast({ title: e.message || "绑定失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="desktop-bind-page container">
      <NavBar title="绑定桌面端" />
      <Text className="bind-desc">
        将桌面端设备与小程序关联，随时在桌面看到宠物动态
      </Text>

      <View className="form-item">
        <Text className="label">设备名称</Text>
        <Input
          className="input-field"
          placeholder="如：书房桌面端"
          value={name}
          onInput={(e) => setName(e.detail.value)}
        />
      </View>

      <Text className="mock-badge">⚠ Mock 模式：蓝牙搜索使用模拟数据</Text>
      <View className="btn-primary mock-btn" onClick={handleBind}>
        {loading ? "Mock 绑定中..." : "Mock 绑定设备"}
      </View>

      <View className="alt-option card">
        <Text className="alt-title">没有桌面端？</Text>
        <Text className="alt-desc">
          你可以向好友申请授权，在好友的桌面端看到你的宠物
        </Text>
      </View>
    </View>
  );
}
