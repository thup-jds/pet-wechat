import { View, Text, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import NavBar from "../../components/NavBar";
import { markGuideCompleted } from "../../utils/storage";
import { ICON_LINK } from "../../assets/icons";
import dogImage from "../../assets/images/dog.png";
import collarImage from "../../assets/images/collar-icon.png";
import desktopImage from "../../assets/images/desktop-icon.png";
import "./index.scss";

export default function Guide() {
  const handleSkip = () => {
    markGuideCompleted();
    Taro.switchTab({ url: "/pages/index/index" });
  };

  const handleCollarSetup = () => {
    markGuideCompleted();
    Taro.navigateTo({ url: "/pages/collar-bind/index" });
  };

  const handleDesktopSetup = () => {
    markGuideCompleted();
    Taro.navigateTo({ url: "/pages/desktop-bind/index" });
  };

  return (
    <View className="guide-page">
      <NavBar title="YEHEY" />

      <View
        className="section-card"
        onClick={handleCollarSetup}
      >
        <Text className="section-title">我有宠物陪伴</Text>
        <Text className="section-subtitle">
          优先配置项圈，同步宠物的真实行为
        </Text>
        <View className="illustration-area">
          <View className="illustration-icons">
            <Image className="illustration-icon" src={dogImage} mode="aspectFit" />
            <Image className="illustration-link" src={ICON_LINK} mode="aspectFit" />
            <Image className="illustration-icon" src={collarImage} mode="aspectFit" />
          </View>
        </View>
      </View>

      <Text className="middle-text">欢迎来到宠物新世界</Text>

      <View
        className="section-card"
        onClick={handleDesktopSetup}
      >
        <Text className="section-title">开启桌面宠物</Text>
        <Text className="section-subtitle">
          配置桌面端设备，开启数字宠物体验
        </Text>
        <View className="illustration-area">
          <View className="illustration-icons">
            <Image className="illustration-icon" src={dogImage} mode="aspectFit" />
            <Image className="illustration-link" src={ICON_LINK} mode="aspectFit" />
            <Image className="illustration-icon" src={desktopImage} mode="aspectFit" />
          </View>
        </View>
      </View>

      <Text className="skip-link" onClick={handleSkip}>
        跳过，稍后再设置
      </Text>
    </View>
  );
}
