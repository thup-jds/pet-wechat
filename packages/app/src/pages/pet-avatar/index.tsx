import { View, Text, Image } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useState, useEffect } from "react";
import { request, getToken, BASE_URL } from "../../utils/request";
import NavBar from "../../components/NavBar";
import { ICON_PAW, ICON_CAT, ICON_DOG, ICON_PHOTO } from "../../assets/icons";
import type { Pet, User } from "@pet-wechat/shared";
import "./index.scss";

const UPLOAD_CONCURRENCY = 3;

function chunkArray<T>(list: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < list.length; index += size) {
    chunks.push(list.slice(index, index + size));
  }
  return chunks;
}

export default function PetAvatar() {
  const router = useRouter();
  const petId = router.params.petId;

  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("上传中...");
  const [pet, setPet] = useState<Pet | null>(null);
  const [quota, setQuota] = useState({ remaining: 2, total: 2 });

  useEffect(() => {
    if (!petId) return;
    // 加载宠物信息
    request<{ pet: Pet }>({ url: `/api/pets/${petId}` })
      .then((res) => setPet(res.pet))
      .catch(() => {});
    // 加载用户配额
    request<{ user: User }>({ url: "/api/me" })
      .then((res) => setQuota({ remaining: res.user.avatarQuota, total: 2 }))
      .catch(() => {});
  }, [petId]);

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
      const token = getToken();
      const uploadedUrls = new Array<string>(images.length);
      let uploadedCount = 0;
      setLoadingText(`上传中 (0/${images.length})...`);

      const imageTasks = images.map((imagePath, index) => ({ imagePath, index }));
      for (const group of chunkArray(imageTasks, UPLOAD_CONCURRENCY)) {
        await Promise.all(
          group.map(async ({ imagePath, index }) => {
            const uploadRes = await Taro.uploadFile({
              url: `${BASE_URL}/api/upload`,
              filePath: imagePath,
              name: "file",
              header: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const uploadData = JSON.parse(uploadRes.data ?? "{}");
            if (uploadRes.statusCode >= 400) {
              throw new Error(uploadData.error ?? "上传失败");
            }
            if (!uploadData.url) {
              throw new Error("上传结果缺少 URL");
            }
            uploadedUrls[index] = uploadData.url;
            uploadedCount += 1;
            setLoadingText(`上传中 (${uploadedCount}/${images.length})...`);
          }),
        );
      }

      const { avatar } = await request<{ avatar: { id: string } }>({
        url: "/api/avatars",
        method: "POST",
        data: {
          petId,
          sourceImageUrl: uploadedUrls[0],
          additionalImages: uploadedUrls.slice(1),
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
      <NavBar title="定制宠物动态" />

      {/* TODO: 替换为半透明猫狗背景插画 (image-import-24.png) */}
      <View className="bg-illustration">
        <Image className="bg-illustration-icon" src={ICON_PAW} mode="aspectFit" />
      </View>

      <View className="main-card">
        <Text className="card-title">定制宠物动态</Text>

        <View className="pet-info-brief">
          <View className="pet-avatar-icon">
            <Image className="pet-avatar-img" src={pet?.species === "dog" ? ICON_DOG : ICON_CAT} mode="aspectFit" />
          </View>
          <View className="pet-meta">
            <Text className="pet-name">{pet?.name ?? "我的宠物"}</Text>
            <Text className="pet-detail">
              {pet?.breed ?? "未知品种"} · {pet?.gender === "male" ? "公" : pet?.gender === "female" ? "母" : ""}
            </Text>
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
          上传宠物照片，专属定制你的宠物动态图像
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
              <Image className="upload-icon-img" src={ICON_PHOTO} mode="aspectFit" />
              <Text className="upload-text">点击上传照片</Text>
            </View>
          )}
        </View>

        <Text className="quota-info">
          新用户免费定制{quota.total}次 ({quota.remaining}/{quota.total})
        </Text>

        <View
          className={`btn-primary start-btn ${images.length === 0 ? "disabled" : ""}`}
          onClick={handleUpload}
        >
          {loading ? loadingText : "开始定制！您的宠物动态图像"}
        </View>

        <Text className="skip-link" onClick={handleSkip}>
          跳过，稍后再完成
        </Text>
      </View>
    </View>
  );
}
