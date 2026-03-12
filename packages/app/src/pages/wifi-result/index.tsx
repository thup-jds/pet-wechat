import { View, Text, Image } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import NavBar from "../../components/NavBar";
import { ICON_CHECK_GREEN, ICON_ERROR_RED } from "../../assets/icons";
import "./index.scss";

/**
 * WiFi 连接结果页
 * 设计稿: jBoj0 (成功), 0U4wA (失败)
 * 成功: 绿勾 + "网络配置成功" + "进入项圈-宠物匹配" 按钮
 * 失败: 红X + "网络配置失败" + "重新连接" 按钮
 */
export default function WifiResult() {
  const router = useRouter();
  const success = router.params.success === "true";
  const collarId = router.params.collarId;

  const handleAction = () => {
    if (success && collarId) {
      Taro.navigateTo({ url: `/pages/pet-info/index?collarId=${collarId}` });
    } else {
      // 失败: 返回 wifi-config 重试
      Taro.navigateBack();
    }
  };

  return (
    <View className="wifi-result-page">
      <NavBar title="配置结果" />
      <View className="result-card-wrapper">
      <View className="result-card">
        <Text className="result-title">
          {success ? "网络配置成功" : "网络配置失败"}
        </Text>
        <Image
          className="result-icon"
          src={success ? ICON_CHECK_GREEN : ICON_ERROR_RED}
          mode="aspectFit"
        />
        <View className="result-btn" onClick={handleAction}>
          <Text className="result-btn-text">
            {success ? "进入项圈-宠物匹配" : "重新连接"}
          </Text>
        </View>
      </View>
      </View>
    </View>
  );
}
