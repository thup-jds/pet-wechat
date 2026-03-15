import { View, Text, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState } from "react";
import NavBar from "../../components/NavBar";
import { ICON_PAW, ICON_COLLAR, ICON_CAT, ICON_BLUETOOTH } from "../../assets/icons";
import "./index.scss";

type Step = 1 | 2;

export default function CollarBind() {
  const [step, setStep] = useState<Step>(1);
  // TODO: 替换为真实蓝牙扫描到的设备 ID
  const deviceId = "YEHEY-A1B2C3";

  // TODO: 接入真实蓝牙 API，当前为 Mock
  const handleSearch = () => {
    Taro.showLoading({ title: "搜索中..." });
    setTimeout(() => {
      Taro.hideLoading();
      setStep(2);
    }, 2000);
  };

  const handleConnect = () => {
    Taro.showLoading({ title: "连接中..." });
    setTimeout(() => {
      Taro.hideLoading();
      Taro.showToast({ title: "连接成功", icon: "success" });
      setTimeout(() => {
        Taro.navigateTo({ url: "/pages/wifi-config/index" });
      }, 1000);
    }, 1500);
  };

  return (
    <View className="collar-bind-page">
      <NavBar title="配置项圈" />

      {/* TODO: 替换为半透明猫狗背景插画 (image-import-24.png) */}
      <View className="bg-illustration">
        <Image className="bg-illustration-icon" src={ICON_PAW} mode="aspectFit" />
      </View>

      <View className="main-card">
        <Text className="card-title">配置宠物项圈</Text>

        {/* TODO: 替换为项圈+猫狗插画 (image-import-5.png + image-import-17.png) */}
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
            {/* TODO: 替换为充电示意插画 (image-import-28.png) */}
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
            <View className="device-found-card">
              <Image className="device-icon-img" src={ICON_BLUETOOTH} mode="aspectFit" />
              <Text className="device-id">{deviceId}</Text>
              <Text className="device-status">已发现设备</Text>
            </View>
          )}
        </View>

        <Text className="mock-badge">⚠ Mock 模式：蓝牙搜索使用模拟数据</Text>
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

      {/* 步骤指示: 搜索 → 连接 → WiFi → 完成 */}
      <View className="step-indicator">
        <View className={`step-dot ${step >= 1 ? "active" : ""}`}>
          <Text className="step-dot-text">1</Text>
        </View>
        <View className={`step-line ${step >= 2 ? "done" : ""}`} />
        <View className={`step-dot ${step >= 2 ? "active" : ""}`}>
          <Text className="step-dot-text">2</Text>
        </View>
        <View className="step-line" />
        <View className="step-dot">
          <Text className="step-dot-text">3</Text>
        </View>
      </View>
    </View>
  );
}
