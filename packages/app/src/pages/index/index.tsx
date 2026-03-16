import { View, Text, Image, Swiper, SwiperItem } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { request } from "../../utils/request";
import { isLoggedIn } from "../../utils/storage";
import { ICON_PAW } from "../../assets/icons";
import type { Pet, CollarDevice, DesktopDevice } from "@pet-wechat/shared";
import petHero from "../../assets/images/pet-hero.png";
import petAvatarDefault from "../../assets/images/pet-avatar-default.png";
import btnUser from "../../assets/images/btn-user.png";
import btnData from "../../assets/images/btn-data.png";
import btnSettings from "../../assets/images/btn-settings.png";
import speechBubbleBg from "../../assets/images/speech-bubble-bg.png";
import bellIcon from "../../assets/images/bell-icon.png";
import collarIcon from "../../assets/images/collar-icon.png";
import desktopIcon from "../../assets/images/desktop-icon.png";
import arrowSwipe from "../../assets/images/arrow-swipe.png";
import "./index.scss";

type HomeState = "not-logged" | "no-pet" | "no-device" | "normal";

function getActivityColor(score: number): string {
  if (score < 30) return "#ef8354";
  if (score < 70) return "#f2c94c";
  return "#5aa67a";
}

function getActivityLabel(score: number): string {
  if (score < 30) return "低";
  if (score < 70) return "中";
  return "高";
}

export default function Index() {
  const statusBarHeight = Taro.getSystemInfoSync().statusBarHeight ?? 20;
  const [ownPets, setOwnPets] = useState<Pet[]>([]);
  const [authorizedPets, setAuthorizedPets] = useState<Pet[]>([]);
  const [currentPetIndex, setCurrentPetIndex] = useState(0);
  const [collars, setCollars] = useState<CollarDevice[]>([]);
  const [desktops, setDesktops] = useState<DesktopDevice[]>([]);
  const [state, setState] = useState<HomeState>("not-logged");

  useDidShow(() => {
    if (!isLoggedIn()) {
      setState("not-logged");
      return;
    }
    void loadData();
  });

  const loadData = async () => {
    try {
      const [{ pets, authorizedPets: sharedPets }, { collars: collarList }, { desktops: desktopList }] =
        await Promise.all([
          request<{ pets: Pet[]; authorizedPets: Pet[] }>({ url: "/api/pets" }),
          request<{ collars: CollarDevice[] }>({ url: "/api/devices/collars" }),
          request<{ desktops: DesktopDevice[] }>({ url: "/api/devices/desktops" }),
        ]);

      setOwnPets(pets);
      setAuthorizedPets(sharedPets);
      setCollars(collarList);
      setDesktops(desktopList);

      const petList = [...pets, ...sharedPets];
      if (petList.length === 0) {
        setState("no-pet");
        setCurrentPetIndex(0);
        return;
      }

      if (currentPetIndex >= petList.length) {
        setCurrentPetIndex(0);
      }

      setState(collarList.length === 0 && desktopList.length === 0 ? "no-device" : "normal");
    } catch {
      Taro.showToast({ title: "网络异常，请重试", icon: "none" });
    }
  };

  const allPets = [...ownPets, ...authorizedPets];
  const currentPet = allPets[currentPetIndex];
  const activityScore = currentPet?.activityScore ?? 0;
  const activityColor = getActivityColor(activityScore);
  const activityProgress = `${Math.min(Math.max(activityScore, 0), 100)}%`;
  const isAuthorizedPet = authorizedPets.some((pet) => pet.id === currentPet?.id);
  const currentCollar = collars.find((collar) => collar.petId === currentPet?.id);
  const onlineDesktopCount = desktops.filter((desktop) => desktop.status === "online").length;
  const hasMultiplePets = allPets.length > 1;
  const swipeProgress = allPets.length > 1 ? ((currentPetIndex + 1) / allPets.length) * 100 : 100;
  const speechText =
    state === "no-device"
      ? "主人，帮我连接设备，我想把陪伴带回家。"
      : "主人，今天的活力值不错，记得继续陪我玩。";

  const actionButtons = [
    { key: "user", label: "用户", icon: btnUser },
    { key: "data", label: "数据", icon: btnData },
    { key: "settings", label: "设置", icon: btnSettings },
  ];

  const handleAction = (key: string) => {
    if (key === "user") {
      Taro.switchTab({ url: "/pages/profile/index" });
      return;
    }
    if (key === "data") {
      Taro.navigateTo({ url: `/pages/pet-info/index${currentPet ? `?id=${currentPet.id}` : ""}` });
      return;
    }
    Taro.navigateTo({ url: "/pages/settings/index" });
  };

  if (state === "not-logged") {
    return (
      <View className="home-page">
        <View className="empty-state">
          <Image className="empty-icon" src={ICON_PAW} mode="aspectFit" />
          <Text className="empty-title">登录后查看你的宠物宇宙</Text>
          <Text className="empty-desc">管理宠物动态、设备连接和桌面陪伴体验。</Text>
          <View className="btn-primary" onClick={() => Taro.navigateTo({ url: "/pages/login/index" })}>
            去登录
          </View>
        </View>
      </View>
    );
  }

  if (state === "no-pet") {
    return (
      <View className="home-page">
        <View className="top-bar" style={{ paddingTop: `${statusBarHeight}px` }}>
          <View className="pet-profile">
            <Image className="pet-avatar-circle" src={petAvatarDefault} mode="aspectFill" />
            <View className="pet-info">
              <Text className="pet-name">还没有宠物档案</Text>
              <Text className="pet-subtitle">先创建你的第一只宠物</Text>
            </View>
          </View>
        </View>

        <View className="home-main empty-main">
          <View className="hero-shell empty-hero" onClick={() => Taro.navigateTo({ url: "/pages/pet-info/index" })}>
            <Image className="hero-image" src={petHero} mode="aspectFit" />
            <Text className="empty-hero-text">点击添加宠物资料</Text>
          </View>
        </View>

        <View className="device-cards">
          <View className="device-card empty" onClick={() => Taro.navigateTo({ url: "/pages/collar-bind/index" })}>
            <Image className="device-card-icon" src={collarIcon} mode="aspectFit" />
            <Text className="device-card-title">连接项圈</Text>
            <Text className="device-card-desc">同步真实活动，完善宠物日常记录。</Text>
          </View>
          <View className="device-card empty" onClick={() => Taro.navigateTo({ url: "/pages/desktop-bind/index" })}>
            <Image className="device-card-icon" src={desktopIcon} mode="aspectFit" />
            <Text className="device-card-title">连接桌面端</Text>
            <Text className="device-card-desc">让宠物在桌面上陪伴你。</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="home-page">
      <View className="top-bar" style={{ paddingTop: `${statusBarHeight}px` }}>
        <View className="pet-profile">
          <Image className="pet-avatar-circle" src={petAvatarDefault} mode="aspectFill" />
          <View className="pet-info">
            <Text className="pet-name">{currentPet?.name ?? "宠物"}</Text>
            <Text className="pet-subtitle">{isAuthorizedPet ? "被授权访问的宠物" : "你的宠物搭子"}</Text>
          </View>
        </View>
      </View>

      <View className="home-main">
        <View className="left-rail">
          <View className="activity-panel">
            <Text className="activity-label">活跃值</Text>
            <View className="activity-track">
              <View className="activity-fill" style={{ height: activityProgress, background: activityColor }} />
            </View>
            <View className="activity-score" style={{ borderColor: activityColor }}>
              <Text className="activity-score-text">{Math.round(activityScore)}</Text>
            </View>
            <Text className="activity-level" style={{ color: activityColor }}>
              {getActivityLabel(activityScore)}
            </Text>
          </View>

          <View className="notification-card" onClick={() => Taro.switchTab({ url: "/pages/messages/index" })}>
            <Image className="notification-icon" src={bellIcon} mode="aspectFit" />
            <View className="notification-dot" />
          </View>
        </View>

        <View className="hero-section">
          <View className="speech-bubble" style={{ backgroundImage: `url(${speechBubbleBg})` }}>
            <Text className="speech-text">{speechText}</Text>
          </View>

          {hasMultiplePets ? (
            <Swiper className="pet-swiper" current={currentPetIndex} onChange={(e) => setCurrentPetIndex(e.detail.current)}>
              {allPets.map((pet) => (
                <SwiperItem key={pet.id}>
                  <View className="hero-shell">
                    <Image className="hero-image" src={petHero} mode="aspectFit" />
                    <Text className="hero-caption">{pet.name}</Text>
                  </View>
                </SwiperItem>
              ))}
            </Swiper>
          ) : (
            <View className="hero-shell">
              <Image className="hero-image" src={petHero} mode="aspectFit" />
              <Text className="hero-caption">{currentPet?.name ?? "宠物"}</Text>
            </View>
          )}

          <View className="swipe-indicator">
            <Image className="swipe-arrow" src={arrowSwipe} mode="aspectFit" />
            <Text className="swipe-text">左右滑动切换宠物</Text>
            <View className="swipe-progress-track">
              <View className="swipe-progress-fill" style={{ width: `${swipeProgress}%` }} />
            </View>
          </View>
        </View>
      </View>

      <View className="action-buttons">
        {actionButtons.map((button) => (
          <View key={button.key} className="action-button" onClick={() => handleAction(button.key)}>
            <Image className="action-button-icon" src={button.icon} mode="aspectFit" />
            <Text className="action-button-label">{button.label}</Text>
          </View>
        ))}
      </View>

      <View className="device-cards">
        <View className={`device-card ${state === "no-device" ? "empty" : ""}`} onClick={() => Taro.switchTab({ url: "/pages/devices/index" })}>
          <View className="device-card-head">
            <Image className="device-card-icon" src={collarIcon} mode="aspectFit" />
            <View>
              <Text className="device-card-title">{currentCollar?.name ?? `${currentPet?.name ?? "宠物"}的小圈圈`}</Text>
              <Text className="device-card-desc">
                {currentCollar
                  ? currentCollar.status === "online"
                    ? `在线 · 电量 ${currentCollar.battery ?? "--"}%`
                    : "已绑定，等待上线"
                  : "还没有绑定项圈设备"}
              </Text>
            </View>
          </View>
        </View>

        <View className={`device-card ${state === "no-device" ? "empty" : ""}`} onClick={() => Taro.switchTab({ url: "/pages/devices/index" })}>
          <View className="device-card-head">
            <Image className="device-card-icon" src={desktopIcon} mode="aspectFit" />
            <View>
              <Text className="device-card-title">{`${currentPet?.name ?? "宠物"}的秘密基地`}</Text>
              <Text className="device-card-desc">
                {onlineDesktopCount > 0 ? `${onlineDesktopCount} 台桌面设备在线` : "还没有在线的桌面设备"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
