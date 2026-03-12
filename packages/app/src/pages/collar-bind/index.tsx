import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState } from "react";
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
      <Text className="brand-title">YEHEY</Text>

      {/* TODO: 替换为半透明猫狗背景插画 */}
      <View className="bg-illustration">
        <Text className="bg-illustration-emoji">🐾</Text>
      </View>

      <View className="main-card">
        <Text className="card-title">配置宠物项圈</Text>

        {/* TODO: 替换为项圈+猫狗插画 */}
        <View className="collar-illustration">
          <Text className="collar-illustration-emoji">📿🐱</Text>
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
          <View
            className="step-illustration-area"
            onClick={step === 1 ? handleSearch : undefined}
          >
            {/* TODO: 替换为充电示意插画 */}
            <Text className="step-illustration-placeholder">🔌⚡</Text>
            {step === 1 && (
              <Text className="step-action-hint">点击开始搜索设备</Text>
            )}
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
          <View
            className={`step-illustration-area ${step === 2 ? "active" : ""}`}
            onClick={step === 2 ? handleConnect : undefined}
          >
            {step === 2 ? (
              <View className="device-found-info">
                {/* TODO: 替换为蓝牙设备插画 */}
                <Text className="device-icon-emoji">📡</Text>
                <Text className="device-id">{deviceId}</Text>
                <Text className="device-connect-hint">点击连接设备</Text>
              </View>
            ) : (
              <>
                {/* TODO: 替换为蓝牙搜索示意插画 */}
                <Text className="step-illustration-placeholder">📱🔵</Text>
              </>
            )}
          </View>
        </View>
      </View>

      <View className="progress-indicator">
        <View className={`progress-segment ${step >= 1 ? "active" : ""}`} />
        <View className={`progress-segment ${step >= 2 ? "active" : ""}`} />
        <View className="progress-segment" />
        <View className="progress-segment" />
      </View>
    </View>
  );
}
