import { Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { isMockMode, setMockMode } from "../../mock/mode";
import "./index.scss";

export default function MockToggle() {
  const [enabled, setEnabled] = useState(() => isMockMode());

  useDidShow(() => {
    setEnabled(isMockMode());
  });

  const handleToggle = () => {
    const nextEnabled = !enabled;
    setMockMode(nextEnabled);
    setEnabled(nextEnabled);

    Taro.showToast({
      title: nextEnabled ? "UI 打磨模式已开启" : "UI 打磨模式已关闭",
      icon: "none",
    });

    setTimeout(() => {
      Taro.reLaunch({ url: "/pages/index/index" });
    }, 200);
  };

  return (
    <View
      className={`mock-toggle ${enabled ? "is-enabled" : "is-disabled"}`}
      onClick={handleToggle}
    >
      <Text className="mock-toggle-label">M</Text>
    </View>
  );
}
