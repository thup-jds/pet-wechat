import { View, Text, Image } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useState } from "react";
import { request } from "../../utils/request";
import "./index.scss";

export default function PetAvatar() {
  const router = useRouter();
  const petId = router.params.petId;

  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  // TODO: 从后端获取真实配额信息
  const remainingQuota = 2;
  const totalQuota = 2;

  const handleChooseImage = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 9 - images.length,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
      });
      setImages((prev) => [...prev, ...res.tempFilePaths].slice(0, 9));
    } catch {
      // 用户取消选择
    }
  };

  const handleUpload = async () => {
    if (images.length === 0 || !petId) return;
    setLoading(true);
    try {
      // TODO: 实际应上传到 OSS，这里 MVP 阶段直接用本地路径模拟
      const { avatar } = await request<{ avatar: { id: string } }>({
        url: "/api/avatars",
        method: "POST",
        data: {
          petId,
          sourceImageUrl: images[0],
        },
      });
      Taro.redirectTo({
        url: `/pages/avatar-progress/index?avatarId=${avatar.id}`,
      });
    } catch (e: any) {
      Taro.showToast({ title: e.message || "上传失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Taro.switchTab({ url: "/pages/index/index" });
  };

  return (
    <View className="pet-avatar-page">
      <Text className="brand-title">YEHEY</Text>

      {/* TODO: 替换为半透明猫狗背景插画 */}
      <View className="bg-illustration">
        <Text className="bg-illustration-emoji">🐾</Text>
      </View>

      <View className="main-card">
        <Text className="card-title">定制宠物动态</Text>

        {/* TODO: 替换为真实宠物头像和信息 */}
        <View className="pet-info-brief">
          <View className="pet-avatar-icon">
            <Text className="pet-avatar-emoji">🐱</Text>
          </View>
          <View className="pet-meta">
            <Text className="pet-name">我的宠物</Text>
            <Text className="pet-detail">品种 · 年龄</Text>
          </View>
        </View>

        <View className="example-section">
          <Text className="example-label">图像上传示例：</Text>
          <View className="example-grid">
            {/* TODO: 替换为真实示例图片 */}
            {[1, 2, 3, 4].map((i) => (
              <View key={i} className="example-item">
                <Text className="example-placeholder-text">示例{i}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text className="upload-desc">
          上传宠物照片，专属定制理宠物动态图像
        </Text>

        <View className="upload-area" onClick={handleChooseImage}>
          {images.length > 0 ? (
            <View className="image-grid">
              {images.map((img, idx) => (
                <Image
                  key={idx}
                  className="preview-thumb"
                  src={img}
                  mode="aspectFill"
                />
              ))}
              {images.length < 9 && (
                <View className="add-more">
                  <Text className="add-more-plus">+</Text>
                </View>
              )}
            </View>
          ) : (
            <View className="upload-placeholder">
              <Text className="upload-icon">📷</Text>
              <Text className="upload-text">点击上传照片</Text>
            </View>
          )}
        </View>

        <Text className="quota-info">
          新用户免费定制{totalQuota}次 ({remainingQuota}/{totalQuota})
        </Text>

        <View
          className={`btn-primary start-btn ${images.length === 0 ? "disabled" : ""}`}
          onClick={handleUpload}
        >
          {loading ? "上传中..." : "开始定制！您的宠物动态图像"}
        </View>

        <Text className="skip-link" onClick={handleSkip}>
          我试，稍后再完成
        </Text>
      </View>
    </View>
  );
}
