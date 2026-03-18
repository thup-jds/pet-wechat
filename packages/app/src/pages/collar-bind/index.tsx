import { View, Text, Image, ScrollView } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState } from "react";
import NavBar from "../../components/NavBar";
import StepIndicator from "../../components/StepIndicator";
import MockBadge from "../../components/MockBadge";
import { request } from "../../utils/request";
import { ICON_PAW, ICON_COLLAR, ICON_CAT, ICON_BLUETOOTH } from "../../assets/icons";
import type { CollarDevice } from "@pet-wechat/shared";
import "./index.scss";

type Step = 1 | 2;

export default function CollarBind() {
  const [step, setStep] = useState<Step>(1);
  const [devices, setDevices] = useState<CollarDevice[]>([]);
  const [selectedId, setSelectedId] = useState("");

  const handleSearch = async () => {
    Taro.showLoading({ title: "搜索中..." });
    try {
      const { collars } = await request<{ collars: CollarDevice[] }>({
        url: "/api/devices/collars/unowned",
      });
      setDevices(collars);
      setSelectedId("");
      if (collars.length > 0) {
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
          url: `/pages/wifi-config/index?deviceType=collar&deviceId=${selectedId}`,
        });
      }, 1000);
    }, 1500);
  };

  return (
    <View className="collar-bind-page">
      <NavBar title="配置项圈" />

      <View className="bg-illustration">
        <Image className="bg-illustration-icon" src={ICON_PAW} mode="aspectFit" />
      </View>

      <View className="main-card">
        <Text className="card-title">配置宠物项圈</Text>

        <View className="collar-illustration">
          <Image className="collar-illustration-icon" src={ICON_COLLAR} mode="aspectFit" />
          <Image className="collar-illustration-cat" src={ICON_CAT} mode="aspectFit" />
        </View>

        <View className="step-section">
          <View className="step-row">
            <View className="step-number">
              <Text className="step-number-text">1</Text>
            </View>
            <Text className="step-desc">
              使用磁吸充电线给项圈充电以启动设备
            </Text>
          </View>
          <View className="step-illustration-area">
            <Image className="step-illustration-img" src={ICON_BLUETOOTH} mode="aspectFit" />
          </View>
        </View>

        <View className="step-section">
          <View className="step-row">
            <View className="step-number">
              <Text className="step-number-text">2</Text>
            </View>
            <Text className="step-desc">
              确保手机蓝牙开启，长按蓝牙按键搜索设备
            </Text>
          </View>
          {step === 2 && (
            <ScrollView className="device-list" scrollY>
              {devices.length === 0 ? (
                <Text className="empty-text">未发现可用设备，请在管理后台创建模拟项圈</Text>
              ) : (
                devices.map((d) => (
                  <View
                    key={d.id}
                    className={`device-found-card ${selectedId === d.id ? "selected" : ""}`}
                    onClick={() => setSelectedId(d.id)}
                  >
                    <Image className="device-icon-img" src={ICON_BLUETOOTH} mode="aspectFit" />
                    <View className="device-info">
                      <Text className="device-id">{d.name}</Text>
                      <Text className="device-mac">{d.macAddress}</Text>
                    </View>
                    <MockBadge className="device-mock-tag" text="Mock" />
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </View>

        <MockBadge className="main-mock-badge" text="⚠ Mock 模式：蓝牙搜索使用模拟数据" />
        {step === 1 ? (
          <View className="btn-primary mock-btn" onClick={handleSearch}>
            Mock 搜索设备
          </View>
        ) : (
          <View className="btn-primary mock-btn" onClick={handleConnect}>
            Mock 连接设备
          </View>
        )}
      </View>

      <StepIndicator steps={["准备设备", "搜索蓝牙", "配置网络"]} current={step} />
    </View>
  );
}
