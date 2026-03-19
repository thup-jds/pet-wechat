import { View, Text, Image, ScrollView } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import NavBar from "../../components/NavBar";
import MockToggle from "../../components/MockToggle";
import { request } from "../../utils/request";
import { isLoggedIn } from "../../utils/storage";
import { disconnectWs } from "../../utils/ws";
import { ICON_PAW, ICON_DONE, ICON_CAT } from "../../assets/icons";
import type { User, Pet } from "@pet-wechat/shared";
import "./index.scss";

const MEMBER_BENEFITS = [
  { label: "升级宠物数量", checked: true },
  { label: "升级定制图像", checked: true },
  { label: "云端存储扩容", checked: false },
  { label: "优先客服支持", checked: false },
  { label: "专属主题皮肤", checked: false },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

function isDefaultNickname(nickname?: string | null): boolean {
  const value = nickname?.trim() ?? "";
  if (!value) return true;
  if (value === "微信用户" || value === "(微信用户)") return true;
  return /^用户\d{4}$/.test(value);
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const showNicknameHint = isDefaultNickname(user?.nickname);

  useDidShow(() => {
    if (!isLoggedIn()) return;
    loadData();
  });

  const loadData = async () => {
    try {
      const res = await request<{ user: User }>({ url: "/api/me" });
      setUser(res.user);
      const { pets: petList } = await request<{ pets: Pet[] }>({
        url: "/api/pets",
      });
      setPets(petList);
    } catch {
      // ignore
    }
  };

  const handleEditNickname = () => {
    Taro.showModal({
      title: "编辑昵称",
      editable: true,
      placeholderText: user?.nickname || "请输入昵称",
      success: async (res) => {
        if (res.confirm && res.content?.trim()) {
          try {
            await request({
              url: "/api/me",
              method: "PUT",
              data: { nickname: res.content.trim() },
            });
            setUser((prev) =>
              prev ? { ...prev, nickname: res.content!.trim() } : prev
            );
            Taro.showToast({ title: "修改成功", icon: "success" });
          } catch {
            Taro.showToast({ title: "修改失败", icon: "none" });
          }
        }
      },
    });
  };

  const handleLogout = () => {
    Taro.showModal({
      title: "提示",
      content: "确定要退出登录吗？",
      success: (res) => {
        if (res.confirm) {
          disconnectWs();
          Taro.clearStorageSync();
          Taro.reLaunch({ url: "/pages/login/index" });
        }
      },
    });
  };

  if (!isLoggedIn()) {
    return (
      <View className="profile-page">
        <NavBar title="我的" showBack={false} />
        <View className="not-logged">
          <Text className="not-logged-text">登录后查看个人信息</Text>
          <View
            className="btn-primary"
            onClick={() => Taro.navigateTo({ url: "/pages/login/index" })}
          >
            去登录
          </View>
        </View>
        <MockToggle />
      </View>
    );
  }

  return (
    <View className="profile-page">
      <NavBar title="我的" showBack={false} />

      <ScrollView className="profile-content" scrollY>
        {/* 用户头像区域 */}
        <View className="user-hero">
          <View className="avatar-wrapper">
            {user?.avatarUrl ? (
              <Image className="avatar-img" src={user.avatarUrl} mode="aspectFill" />
            ) : (
              <View className="avatar-placeholder">
                <Text className="avatar-letter">
                  {user?.nickname?.[0] || "U"}
                </Text>
              </View>
            )}
          </View>
          <View
            className={`nickname-trigger ${showNicknameHint ? "is-default" : ""}`}
            onClick={handleEditNickname}
          >
            <Text className="user-nickname">{user?.nickname || "(微信用户)"}</Text>
            {showNicknameHint ? (
              <Text className="nickname-hint">点击修改昵称</Text>
            ) : null}
          </View>
          <Text className="user-id">
            ID: {user?.id ? user.id.slice(0, 8) : "---"}
          </Text>
          <View className="member-badge">
            <Text className="member-badge-text">开通会员</Text>
          </View>
        </View>

        {/* 账户信息 */}
        <View className="section">
          <View className="section-header">
            <Text className="section-title">账户信息</Text>
            <View className="edit-btn" onClick={handleEditNickname}>
              <Text className="edit-btn-text">编辑资料</Text>
            </View>
          </View>
          <View className="info-card">
            <View className="info-row">
              <Text className="info-label">手机号</Text>
              <Text className="info-value">
                {user?.phone || "未绑定"}
              </Text>
            </View>
            <View className="info-row">
              <Text className="info-label">邮箱</Text>
              {/* TODO: 邮箱为mock数据，待后端用户表增加email字段后替换 */}
              <Text className="info-value">YEHEY6780@guagua.com</Text>
            </View>
            <View className="info-row last">
              <Text className="info-label">注册日期</Text>
              <Text className="info-value">
                {user?.createdAt ? formatDate(user.createdAt) : "---"}
              </Text>
            </View>
          </View>
        </View>

        {/* 购购服务 - 宠物列表 */}
        <View className="section">
          <Text className="section-title">购购服务</Text>
          <View className="pet-cards">
            {pets.length === 0 ? (
              <View className="info-card">
                <Text className="empty-pets">暂无宠物</Text>
              </View>
            ) : (
              pets.map((pet) => (
                <View key={pet.id} className="pet-card">
                  <View className="pet-avatar-box">
                    <Image className="pet-avatar-icon" src={ICON_PAW} mode="aspectFit" />
                  </View>
                  <View className="pet-info">
                    <Text className="pet-name">{pet.name}</Text>
                    <Text className="pet-detail">
                      {pet.species === "dog" ? "狗" : "猫"}
                      {pet.breed ? ` · ${pet.breed}` : ""}
                      {pet.gender === "male" ? " ♂" : pet.gender === "female" ? " ♀" : ""}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* 会员专属权益 */}
        <View className="section">
          <Text className="section-title">会员专属权益</Text>
          <View className="benefits-list">
            {MEMBER_BENEFITS.map((b, i) => (
              <View key={i} className="benefit-check-item">
                <View className={`benefit-checkbox ${b.checked ? "checked" : ""}`}>
                  {b.checked && <Image className="check-mark-img" src={ICON_DONE} mode="aspectFit" />}
                </View>
                <Text className={`benefit-check-label ${b.checked ? "checked" : ""}`}>
                  {b.label}
                </Text>
              </View>
            ))}
          </View>
          <View className="detail-btn">
            <Text className="detail-btn-text">查看详情</Text>
          </View>
        </View>

        {/* 退出登录 */}
        <View className="logout-area">
          <Text className="logout-text" onClick={handleLogout}>
            退出登录
          </Text>
        </View>

        {/* TODO: 替换为真实装饰猫插画 (image-import-30.png) */}
        <View className="bottom-cat">
          <Image className="cat-deco-img" src={ICON_CAT} mode="aspectFit" />
        </View>
      </ScrollView>
      <MockToggle />
    </View>
  );
}
