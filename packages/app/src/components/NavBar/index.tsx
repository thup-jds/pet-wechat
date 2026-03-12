import { View, Text, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { ICON_ARROW_LEFT } from "../../assets/icons";
import "./index.scss";

interface NavBarProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

export default function NavBar({ title, showBack = true, onBack }: NavBarProps) {
  const { top, height } = Taro.getMenuButtonBoundingClientRect();
  const statusBarHeight = Taro.getSystemInfoSync().statusBarHeight ?? 20;
  const navHeight = (top - statusBarHeight) * 2 + height;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      const pages = Taro.getCurrentPages();
      if (pages.length > 1) {
        Taro.navigateBack();
      } else {
        Taro.switchTab({ url: "/pages/index/index" });
      }
    }
  };

  return (
    <View className="nav-bar" style={{ paddingTop: `${statusBarHeight}px` }}>
      <View className="nav-bar-content" style={{ height: `${navHeight}px` }}>
        {showBack && (
          <View className="nav-back" onClick={handleBack}>
            <Image className="nav-back-icon" src={ICON_ARROW_LEFT} mode="aspectFit" />
          </View>
        )}
        <Text className="nav-title">{title}</Text>
      </View>
    </View>
  );
}
