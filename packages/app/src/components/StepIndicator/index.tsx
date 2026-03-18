import { View, Text } from "@tarojs/components";
import "./index.scss";

interface StepIndicatorProps {
  steps: string[];
  current: number;
}

export default function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <View className="step-indicator">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber <= current;
        const isDone = stepNumber < current;

        return (
          <View key={step} className="step-indicator-item">
            <View className={`step-indicator-dot ${isActive ? "active" : ""}`}>
              <Text className="step-indicator-dot-text">{stepNumber}</Text>
            </View>
            {index < steps.length - 1 ? (
              <View className={`step-indicator-line ${isDone ? "done" : ""}`} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
