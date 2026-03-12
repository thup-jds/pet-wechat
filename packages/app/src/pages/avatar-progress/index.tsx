import { View, Text, Image } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useState, useEffect, useRef } from "react";
import { request } from "../../utils/request";
import NavBar from "../../components/NavBar";
import { ICON_CAT, ICON_CHECK_GREEN, ICON_ERROR_RED, ICON_DONE } from "../../assets/icons";
import type { AvatarStatus } from "@pet-wechat/shared";
import "./index.scss";

export default function AvatarProgress() {
  const router = useRouter();
  const avatarId = router.params.avatarId;

  const [status, setStatus] = useState<AvatarStatus>("pending");
  const [progress, setProgress] = useState(0);
  // TODO: 从后端获取真实生成的动态图像列表
  const [resultImages] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!avatarId) return;

    const poll = async () => {
      try {
        const { avatar } = await request<{ avatar: { status: AvatarStatus } }>({
          url: `/api/avatars/${avatarId}`,
        });
        setStatus(avatar.status);

        if (avatar.status === "done") {
          setProgress(100);
          clearInterval(timerRef.current);
        } else if (avatar.status === "failed") {
          clearInterval(timerRef.current);
        } else if (avatar.status === "processing") {
          setProgress((prev) => Math.min(prev + 10, 90));
        }
      } catch {
        clearInterval(timerRef.current);
      }
    };

    poll();
    timerRef.current = setInterval(poll, 5000);

    return () => clearInterval(timerRef.current);
  }, [avatarId]);

  // 模拟进度增长
  useEffect(() => {
    if (status === "pending" || status === "processing") {
      const t = setInterval(() => {
        setProgress((prev) => Math.min(prev + 1, status === "pending" ? 30 : 90));
      }, 500);
      return () => clearInterval(t);
    }
  }, [status]);

  const handleConfigDesktop = () => {
    Taro.navigateTo({ url: "/pages/desktop-bind/index" });
  };

  const handleGoHome = () => {
    Taro.switchTab({ url: "/pages/index/index" });
  };

  const handleRetry = () => {
    Taro.navigateBack();
  };

  const isComplete = status === "done";

  // 圆形进度环参数 (px)
  const ringSize = 200;
  const strokeWidth = 12;

  return (
    <View className="progress-page">
      <NavBar title="定制进度" />

      <View className="main-card">
        <Text className="card-title">正在定制专属动态</Text>

        <View className="progress-ring-wrapper">
          <View className="progress-ring-container">
            {/* 使用 CSS 实现的圆形进度 */}
            <View
              className="ring-bg"
              style={{
                width: `${ringSize}px`,
                height: `${ringSize}px`,
              }}
            >
              <View
                className="ring-progress"
                style={{
                  background: `conic-gradient(#333 ${progress * 3.6}deg, #eee ${progress * 3.6}deg)`,
                  width: `${ringSize}px`,
                  height: `${ringSize}px`,
                  borderRadius: "50%",
                }}
              >
                <View
                  className="ring-inner"
                  style={{
                    width: `${ringSize - strokeWidth * 2}px`,
                    height: `${ringSize - strokeWidth * 2}px`,
                  }}
                >
                  {/* TODO: 替换为宠物图标 */}
                  <Image className="ring-icon-img" src={ICON_CAT} mode="aspectFit" />
                </View>
              </View>
            </View>
            <Text className="progress-percent">{progress}%</Text>
            {isComplete && (
              <View className="check-badge">
                <Image className="check-icon-img" src={ICON_DONE} mode="aspectFit" />
              </View>
            )}
          </View>
        </View>

        {isComplete && resultImages.length > 0 ? (
          <View className="result-preview">
            {/* TODO: 接入 Swiper 组件实现左右滑动切换 */}
            <Image
              className="result-image"
              src={resultImages[0]}
              mode="aspectFill"
            />
            <View className="swipe-hint">
              <Text className="swipe-arrow">←</Text>
              <Text className="swipe-text">左右滑动查看行为动态</Text>
              <Text className="swipe-arrow">→</Text>
            </View>
          </View>
        ) : isComplete ? (
          <View className="result-preview">
            {/* TODO: 替换为真实生成的宠物动态图像 */}
            <View className="result-placeholder">
              <Image className="result-placeholder-img" src={ICON_CHECK_GREEN} mode="aspectFit" />
              <Text className="result-placeholder-text">动态图像已生成</Text>
            </View>
            <View className="swipe-hint">
              <Text className="swipe-arrow">←</Text>
              <Text className="swipe-text">左右滑动查看行为动态</Text>
              <Text className="swipe-arrow">→</Text>
            </View>
          </View>
        ) : status === "failed" ? (
          <View className="failed-section">
            <Image className="failed-icon-img" src={ICON_ERROR_RED} mode="aspectFit" />
            <Text className="failed-text">
              定制失败，照片可能不太清晰，请重新上传
            </Text>
          </View>
        ) : (
          <View className="processing-hint">
            <Text className="processing-text">
              {status === "pending"
                ? "等待处理中，请耐心等待"
                : "正在生成专属形象..."}
            </Text>
          </View>
        )}

        {isComplete && (
          <View className="action-buttons">
            <View className="btn-primary" onClick={handleConfigDesktop}>
              立即配置桌面端
            </View>
            <View className="btn-secondary" onClick={handleGoHome}>
              后续进入主页
            </View>
          </View>
        )}

        {status === "failed" && (
          <View className="action-buttons">
            <View className="btn-primary" onClick={handleRetry}>
              重新上传
            </View>
          </View>
        )}

        <Text className="retry-link" onClick={handleRetry}>
          不满意？重新定制
        </Text>
      </View>
    </View>
  );
}
