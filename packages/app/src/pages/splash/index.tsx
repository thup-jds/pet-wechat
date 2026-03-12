import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useEffect, useState } from "react";
import { isLoggedIn } from "../../utils/storage";
import "./index.scss";

export default function Splash() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 20 + 10;
        if (next >= 100) {
          clearInterval(timer);
          // 加载完成后跳转
          setTimeout(() => {
            if (isLoggedIn()) {
              Taro.switchTab({ url: "/pages/index/index" });
            } else {
              Taro.redirectTo({ url: "/pages/login/index" });
            }
          }, 300);
          return 100;
        }
        return next;
      });
    }, 400);

    return () => clearInterval(timer);
  }, []);

  return (
    <View className="splash-page">
      <View className="splash-content">
        <View className="logo-area">
          <Text className="logo-icon">🐾</Text>
          <Text className="logo-text">YEHEY</Text>
        </View>
        <View className="progress-bar">
          <View
            className="progress-fill"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </View>
        <Text className="loading-text">加载中...</Text>
      </View>
    </View>
  );
}
