import { View, Text, Image } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { request } from "../../utils/request";
import { isLoggedIn } from "../../utils/storage";
import type { User, Pet } from "@pet-wechat/shared";
import "./index.scss";

const MEMBER_BENEFITS = [
  { icon: "\uD83D\uDC3E", label: "升级宠物数量" },
  { icon: "\uD83C\uDFA8", label: "升级定制图像" },
  { icon: "\uD83D\uDCBE", label: "五倍存储空间" },
  { icon: "\uD83D\uDCDE", label: "优先客服支持" },
  { icon: "\uD83C\uDFA8", label: "专属主题皮肤" },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);

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

  const handleLogout = () => {
    Taro.showModal({
      title: "提示",
      content: "确定要退出登录吗？",
      success: (res) => {
        if (res.confirm) {
          Taro.clearStorageSync();
          Taro.reLaunch({ url: "/pages/login/index" });
        }
      },
    });
  };

  if (!isLoggedIn()) {
    return (
      <View className="profile-page">
        <View className="nav-bar">
          <Text className="nav-title">用户信息</Text>
        </View>
        <View className="not-logged">
          <Text className="not-logged-text">登录后查看个人信息</Text>
          <View
            className="btn-primary"
            onClick={() => Taro.navigateTo({ url: "/pages/login/index" })}
          >
            去登录
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="profile-page">
      <View className="nav-bar">
        <Text className="nav-title">用户信息</Text>
      </View>

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
        <Text className="user-nickname">
          {user?.nickname || "(微信用户)"}
        </Text>
        <Text className="user-id">
          ID: {user?.id ? user.id.slice(0, 8) : "---"}
        </Text>
        <View className="member-badge">
          <Text className="member-badge-text">开通会员</Text>
        </View>
      </View>

      {/* 账户信息 */}
      <View className="section">
        <Text className="section-title">账户信息</Text>
        <View className="info-card">
          <View className="info-row">
            <Text className="info-label">手机号</Text>
            <Text className="info-value">
              {user?.phone || "未绑定"}
            </Text>
          </View>
          <View className="info-row">
            <Text className="info-label">邮箱</Text>
            <Text className="info-value">未绑定</Text>
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
                  <Text className="pet-avatar-emoji">🐾</Text>
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
        <View className="benefits-grid">
          {MEMBER_BENEFITS.map((b, i) => (
            <View key={i} className="benefit-item">
              <Text className="benefit-icon">{b.icon}</Text>
              <Text className="benefit-label">{b.label}</Text>
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

      {/* 底部装饰 */}
      <View className="bottom-cat">
        {/* TODO: 替换为实际猫咪装饰图 */}
        <Text className="cat-deco">🐱</Text>
      </View>
    </View>
  );
}
