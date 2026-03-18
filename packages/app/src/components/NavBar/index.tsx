import { View, Text, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import type { ReactNode } from "react";
import { ICON_ARROW_LEFT } from "../../assets/icons";
import { useSafeArea } from "../../hooks/useSafeArea";
import "./index.scss";

interface NavBarProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  leftContent?: ReactNode;
  rightContent?: ReactNode;
  transparent?: boolean;
}

export default function NavBar({
  title,
  showBack = true,
  onBack,
  leftContent,
  rightContent,
  transparent = false,
}: NavBarProps) {
  const { statusBarHeight, navHeight } = useSafeArea();

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

  const leftNode = leftContent ? (
    <View className="nav-side-content">{leftContent}</View>
  ) : showBack ? (
    <View className="nav-back" onClick={handleBack}>
      <Image className="nav-back-icon" src={ICON_ARROW_LEFT} mode="aspectFit" />
    </View>
  ) : null;

  return (
    <View
      className={`nav-bar ${transparent ? "nav-bar--transparent" : ""}`}
      style={{ paddingTop: `${statusBarHeight}px` }}
    >
      <View className="nav-bar-content" style={{ height: `${navHeight}px` }}>
        <View className="nav-side nav-side--left">{leftNode}</View>
        <Text className="nav-title">{title}</Text>
        <View className="nav-side nav-side--right">
          {rightContent ? <View className="nav-side-content">{rightContent}</View> : null}
        </View>
      </View>
    </View>
  );
}
