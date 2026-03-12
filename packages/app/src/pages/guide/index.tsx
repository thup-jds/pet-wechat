import { View, Text, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import NavBar from "../../components/NavBar";
import { ICON_COLLAR, ICON_CAT, ICON_DOG, ICON_DESKTOP } from "../../assets/icons";
import "./index.scss";

export default function Guide() {
  return (
    <View className="guide-page">
      <NavBar title="YEHEY" />

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
          <View className="illustration-icons">
            <Image className="illustration-icon" src={ICON_DOG} mode="aspectFit" />
            <Image className="illustration-icon" src={ICON_COLLAR} mode="aspectFit" />
            <Image className="illustration-icon" src={ICON_CAT} mode="aspectFit" />
          </View>
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
          <Image className="illustration-icon large" src={ICON_DESKTOP} mode="aspectFit" />
        </View>
      </View>
    </View>
  );
}
