import { View, Text, Image, ScrollView } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState } from "react";
import NavBar from "../../components/NavBar";
import MockBadge from "../../components/MockBadge";
import { request } from "../../utils/request";
import { ICON_DESKTOP } from "../../assets/icons";
import type { DesktopDevice } from "@pet-wechat/shared";
import "./index.scss";

type Step = 1 | 2;

export default function DesktopBind() {
  const [step, setStep] = useState<Step>(1);
  const [devices, setDevices] = useState<DesktopDevice[]>([]);
  const [selectedId, setSelectedId] = useState("");

  const handleSearch = async () => {
    Taro.showLoading({ title: "搜索中..." });
    try {
      const { desktops } = await request<{ desktops: DesktopDevice[] }>({
        url: "/api/devices/desktops/unowned",
      });
      setDevices(desktops);
      setSelectedId("");
      if (desktops.length > 0) {
        setStep(2);
      } else {
        Taro.showToast({ title: "未发现可用设备，请先在后台创建", icon: "none" });
      }
    } catch (e: any) {
      Taro.showToast({ title: e.message || "搜索失败", icon: "none" });
    } finally {
      Taro.hideLoading();
    }
  };

  const handleConnect = () => {
    if (!selectedId) {
      Taro.showToast({ title: "请选择一个设备", icon: "none" });
      return;
    }
    Taro.showLoading({ title: "连接中..." });
    setTimeout(() => {
      Taro.hideLoading();
      Taro.showToast({ title: "连接成功", icon: "success" });
      setTimeout(() => {
        Taro.navigateTo({
          url: `/pages/wifi-config/index?deviceType=desktop&deviceId=${selectedId}`,
        });
      }, 1000);
    }, 1500);
  };

  return (
    <View className="desktop-bind-page container">
      <NavBar title="绑定桌面端" />
      <Text className="bind-desc">
        将桌面端设备与小程序关联，随时在桌面看到宠物动态
      </Text>

      {step === 2 && (
        <ScrollView className="device-list" scrollY style={{ maxHeight: "400px" }}>
          {devices.length === 0 ? (
            <Text className="empty-text">未发现可用设备，请在管理后台创建模拟摆台</Text>
          ) : (
            devices.map((d) => (
              <View
                key={d.id}
                className={`device-item card ${selectedId === d.id ? "selected" : ""}`}
                onClick={() => setSelectedId(d.id)}
              >
                <View className="item-name-row">
                  <Image className="item-desktop-icon" src={ICON_DESKTOP} mode="aspectFit" />
                  <View className="device-info">
                    <Text className="item-name">{d.name}</Text>
                    <Text className="device-mac">{d.macAddress}</Text>
                  </View>
                  <MockBadge className="desktop-device-tag" text="Mock" />
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <MockBadge className="desktop-main-badge" text="⚠ Mock 模式：蓝牙搜索使用模拟数据" />
      {step === 1 ? (
        <View className="btn-primary mock-btn" onClick={handleSearch}>
          Mock 搜索设备
        </View>
      ) : (
        <View className="btn-primary mock-btn" onClick={handleConnect}>
          Mock 连接设备
        </View>
      )}

      <View className="alt-option card">
        <Text className="alt-title">没有桌面端？</Text>
        <Text className="alt-desc">
          你可以向好友申请授权，在好友的桌面端看到你的宠物
        </Text>
      </View>
    </View>
  );
}
