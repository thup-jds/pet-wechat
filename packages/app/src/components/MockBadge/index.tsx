import { View, Text } from "@tarojs/components";
import "./index.scss";

interface MockBadgeProps {
  text?: string;
  className?: string;
}

export default function MockBadge({
  text = "模拟模式",
  className = "",
}: MockBadgeProps) {
  return (
    <View className={`mock-badge ${className}`.trim()}>
      <Text className="mock-badge-text">{text}</Text>
    </View>
  );
}
