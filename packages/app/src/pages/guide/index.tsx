import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import "./index.scss";

export default function Guide() {
  return (
    <View className="guide-page">
      <Text className="brand-title">YEHEY</Text>

      <View
        className="section-card"
        onClick={() =>
          Taro.navigateTo({ url: "/pages/collar-bind/index" })
        }
      >
        <Text className="section-title">我有宠物陪伴</Text>
        <Text className="section-subtitle">
          优先配置项圈，同步宠物的真实行为
        </Text>
        <View className="illustration-area">
          {/* TODO: 替换为项圈+猫狗剪影插画 */}
          <Text className="illustration-placeholder">🐕 📿 🐈</Text>
        </View>
      </View>

      <Text className="middle-text">欢迎来到宠物新世界</Text>

      <View
        className="section-card"
        onClick={() =>
          Taro.navigateTo({ url: "/pages/desktop-bind/index" })
        }
      >
        <Text className="section-title">开启桌面宠物</Text>
        <Text className="section-subtitle">
          配置桌面端设备，开启数字宠物体验
        </Text>
        <View className="illustration-area">
          {/* TODO: 替换为水晶球插画 */}
          <Text className="illustration-placeholder">🔮</Text>
        </View>
      </View>
    </View>
  );
}
