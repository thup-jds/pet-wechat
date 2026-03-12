import { View, Text, Input } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState } from "react";
import NavBar from "../../components/NavBar";
import { request } from "../../utils/request";
import "./index.scss";

export default function WifiConfig() {
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // TODO: 接入真实 WiFi 配置流程，当前为 Mock
  const handleConfigure = async () => {
    if (loading) return;
    if (!ssid) {
      Taro.showToast({ title: "请输入 WiFi 名称", icon: "none" });
      return;
    }
    setLoading(true);

    // Mock: 创建项圈设备记录
    try {
      const { collar } = await request<{ collar: { id: string } }>({
        url: "/api/devices/collars",
        method: "POST",
        data: {
          name: "YEHEY Collar",
          macAddress: `mock_${Date.now()}`,
        },
      });

      Taro.showLoading({ title: "配置中..." });
      // TODO: 接入真实 WiFi 配置流程，当前模拟延迟后跳转结果页
      setTimeout(() => {
        Taro.hideLoading();
        // Mock: 随机成功/失败，实际应根据设备返回结果
        const success = true;
        Taro.navigateTo({
          url: `/pages/wifi-result/index?success=${success}&collarId=${collar.id}`,
        });
      }, 2000);
    } catch (e: any) {
      Taro.navigateTo({
        url: "/pages/wifi-result/index?success=false",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="wifi-config-page container">
      <NavBar title="WiFi 配置" />
      <View className="step-indicator">
        <View className="step active">
          <Text className="step-num">1</Text>
        </View>
        <View className="step-line done" />
        <View className="step active">
          <Text className="step-num">2</Text>
        </View>
        <View className="step-line done" />
        <View className="step active">
          <Text className="step-num">3</Text>
        </View>
      </View>

      <Text className="step-title">Step 3: WiFi 配置</Text>
      <Text className="step-desc">
        为项圈配置 WiFi，以便实时同步宠物行为数据
      </Text>

      <View className="form-section">
        <View className="form-item">
          <Text className="label">WiFi 名称</Text>
          <Input
            className="input-field"
            placeholder="输入 WiFi SSID"
            value={ssid}
            onInput={(e) => setSsid(e.detail.value)}
          />
        </View>

        <View className="form-item">
          <Text className="label">WiFi 密码</Text>
          <Input
            className="input-field"
            password
            placeholder="输入 WiFi 密码"
            value={password}
            onInput={(e) => setPassword(e.detail.value)}
          />
        </View>
      </View>

      <View className="btn-primary" onClick={handleConfigure}>
        {loading ? "配置中..." : "完成配置"}
      </View>
    </View>
  );
}
