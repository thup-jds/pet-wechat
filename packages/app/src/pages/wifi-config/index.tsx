import { View, Text, Input } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useState } from "react";
import NavBar from "../../components/NavBar";
import { request } from "../../utils/request";
import "./index.scss";

export default function WifiConfig() {
  const router = useRouter();
  const deviceType = router.params.deviceType as "collar" | "desktop" | undefined;
  const deviceId = router.params.deviceId;

  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfigure = async () => {
    if (loading) return;
    if (!ssid) {
      Taro.showToast({ title: "请输入 WiFi 名称", icon: "none" });
      return;
    }
    setLoading(true);

    try {
      Taro.showLoading({ title: "配置中..." });

      let resultUrl: string;

      if (deviceType === "collar" && deviceId) {
        await request<{ collar: { id: string } }>({
          url: `/api/devices/collars/${deviceId}/claim`,
          method: "POST",
          data: { name: "YEHEY Collar" },
        });
        resultUrl = `/pages/wifi-result/index?success=true&deviceType=collar&collarId=${deviceId}`;
      } else if (deviceType === "desktop" && deviceId) {
        await request<{ desktop: { id: string } }>({
          url: `/api/devices/desktops/${deviceId}/claim`,
          method: "POST",
          data: { name: "YEHEY Desktop" },
        });
        resultUrl = `/pages/wifi-result/index?success=true&deviceType=desktop&desktopId=${deviceId}`;
      } else {
        // 兼容旧流程：直接创建设备
        const { collar } = await request<{ collar: { id: string } }>({
          url: "/api/devices/collars",
          method: "POST",
          data: {
            name: "YEHEY Collar",
            macAddress: `mock_${Date.now()}`,
          },
        });
        resultUrl = `/pages/wifi-result/index?success=true&collarId=${collar.id}`;
      }

      // 模拟配网延迟，loading 状态保持到跳转，防止重复点击
      setTimeout(() => {
        Taro.hideLoading();
        setLoading(false);
        Taro.navigateTo({ url: resultUrl });
      }, 2000);
    } catch (e: any) {
      Taro.hideLoading();
      setLoading(false);
      Taro.navigateTo({
        url: `/pages/wifi-result/index?success=false&deviceType=${deviceType ?? "collar"}`,
      });
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
        {deviceType === "desktop"
          ? "为桌面摆台配置 WiFi，以便实时同步宠物动态"
          : "为项圈配置 WiFi，以便实时同步宠物行为数据"}
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

      <Text className="mock-badge">⚠ Mock 模式：WiFi 配网使用模拟流程</Text>
      <View className="btn-primary mock-btn" onClick={handleConfigure}>
        {loading ? "Mock 配置中..." : "Mock 完成配置"}
      </View>
    </View>
  );
}
