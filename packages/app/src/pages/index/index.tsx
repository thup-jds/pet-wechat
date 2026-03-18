import { View, Text, Image, Swiper, SwiperItem, ScrollView } from "@tarojs/components";
import Taro, { useDidHide, useDidShow } from "@tarojs/taro";
import { useEffect, useState, useRef } from "react";
import { request } from "../../utils/request";
import { isLoggedIn } from "../../utils/storage";
import { ICON_PAW, ICON_ARROW_LEFT, ICON_ARROW_RIGHT, ICON_PHOTO } from "../../assets/icons";
import type {
  Pet,
  CollarDevice,
  DesktopDevice,
  WsAvatarDoneMessage,
  WsBehaviorNewMessage,
} from "@pet-wechat/shared";
import petHero from "../../assets/images/pet-hero.png";
import petAvatarDefault from "../../assets/images/pet-avatar-default.png";
import btnUser from "../../assets/images/btn-user.png";
import btnData from "../../assets/images/btn-data.png";
import btnSettings from "../../assets/images/btn-settings.png";
import speechBubbleBg from "../../assets/images/speech-bubble-bg.png";
import bellIcon from "../../assets/images/bell-icon.png";
import collarIcon from "../../assets/images/collar-icon.png";
import desktopIcon from "../../assets/images/desktop-icon.png";
import { connectWs, disconnectWs, subscribe } from "../../utils/ws";
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

function formatRelativeTime(timestamp: string): string {
  const time = new Date(timestamp).getTime();
  if (Number.isNaN(time)) return "暂无活动记录";

  const diffMs = Math.max(0, Date.now() - time);
  const diffMinutes = Math.floor(diffMs / (60 * 1000));

  if (diffMinutes < 1) return "刚刚";
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}小时前`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}天前`;

  return `${Math.floor(diffDays / 7)}周前`;
}

function getPetStatusText(pet?: Pet): string {
  if (!pet?.latestBehavior) return "暂无活动记录";
  return `${formatRelativeTime(pet.latestBehavior.timestamp)} · ${pet.latestBehavior.actionType}`;
}

function getPetHeroImage(pet?: Pet): string {
  return pet?.avatarImageUrl || petHero;
}

function getPetHeroMode(pet?: Pet): "aspectFill" | "aspectFit" {
  return pet?.avatarImageUrl ? "aspectFill" : "aspectFit";
}

function updatePetLatestBehavior(pets: Pet[], message: WsBehaviorNewMessage): Pet[] {
  let changed = false;

  const nextPets = pets.map((pet) => {
    if (pet.id !== message.data.petId) {
      return pet;
    }

    changed = true;
    return {
      ...pet,
      latestBehavior: {
        actionType: message.data.actionType,
        timestamp: message.data.timestamp,
      },
    };
  });

  return changed ? nextPets : pets;
}

export default function Index() {
  const statusBarHeight = Taro.getSystemInfoSync().statusBarHeight ?? 20;
  const [ownPets, setOwnPets] = useState<Pet[]>([]);
  const [authorizedPets, setAuthorizedPets] = useState<Pet[]>([]);
  const [currentPetIndex, setCurrentPetIndex] = useState(0);
  const [collars, setCollars] = useState<CollarDevice[]>([]);
  const [desktops, setDesktops] = useState<DesktopDevice[]>([]);
  const [state, setState] = useState<HomeState>("not-logged");
  const isPageVisible = useRef(false);

  const handleAvatarDone = (message: WsAvatarDoneMessage) => {
    if (!isPageVisible.current) return;
    Taro.showToast({
      title: `${message.data.petName}形象已就绪`,
      icon: "none",
    });
    void loadData();
  };

  useEffect(() => {
    const unsubscribeBehavior = subscribe("behavior:new", (message) => {
      setOwnPets((prev) => updatePetLatestBehavior(prev, message));
      setAuthorizedPets((prev) => updatePetLatestBehavior(prev, message));
    });
    const unsubscribeAvatarDone = subscribe("avatar:done", handleAvatarDone);

    return () => {
      unsubscribeBehavior();
      unsubscribeAvatarDone();
    };
  }, []);

  useDidShow(() => {
    isPageVisible.current = true;
    if (!isLoggedIn()) {
      disconnectWs();
      setState("not-logged");
      return;
    }
    void connectWs();
    void loadData();
  });

  useDidHide(() => {
    isPageVisible.current = false;
  });

  // WS 连接在 App 级别管理，不在页面 hide 时断开
  // 因为切换 tab 也会触发 hide，频繁断开重连不合理

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
  const isArrowNav = useRef(false);
  const ownPetIds = new Set(ownPets.map((pet) => pet.id));
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

  const handleSwiperChange = (e) => {
    if (isArrowNav.current) {
      isArrowNav.current = false;
      return;
    }
    setCurrentPetIndex(e.detail.current);
  };

  const handlePrevPet = () => {
    if (!hasMultiplePets) return;
    isArrowNav.current = true;
    setCurrentPetIndex((prev) => (prev === 0 ? allPets.length - 1 : prev - 1));
  };

  const handleNextPet = () => {
    if (!hasMultiplePets) return;
    isArrowNav.current = true;
    setCurrentPetIndex((prev) => (prev === allPets.length - 1 ? 0 : prev + 1));
  };

  const handleEditPetAvatar = (petId: string) => {
    Taro.navigateTo({ url: `/pages/pet-avatar/index?petId=${petId}` });
  };

  const renderHeroShell = (pet?: Pet) => (
    <View className="hero-shell">
      <Image
        className="hero-image"
        src={getPetHeroImage(pet)}
        mode={getPetHeroMode(pet)}
      />
      {pet && ownPetIds.has(pet.id) ? (
        <View
          className="hero-edit-btn"
          onClick={() => handleEditPetAvatar(pet.id)}
        >
          <Image className="hero-edit-icon" src={ICON_PHOTO} mode="aspectFit" />
        </View>
      ) : null}
      <Text className="hero-caption">{pet?.name ?? "宠物"}</Text>
      <Text className="pet-status-tag">{getPetStatusText(pet)}</Text>
    </View>
  );

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

        <ScrollView className="home-scroll" scrollY>
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
        </ScrollView>
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

      <ScrollView className="home-scroll" scrollY>
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

            <View className="pet-swiper-wrapper">
              {hasMultiplePets ? (
                <Swiper className="pet-swiper" current={currentPetIndex} onChange={handleSwiperChange}>
                  {allPets.map((pet) => (
                    <SwiperItem key={pet.id}>
                      {renderHeroShell(pet)}
                    </SwiperItem>
                  ))}
                </Swiper>
              ) : (
                renderHeroShell(currentPet)
              )}

              {hasMultiplePets ? (
                <>
                  <Image
                    className="pet-nav-arrow pet-nav-arrow-left"
                    src={ICON_ARROW_LEFT}
                    mode="aspectFit"
                    onClick={handlePrevPet}
                  />
                  <Image
                    className="pet-nav-arrow pet-nav-arrow-right"
                    src={ICON_ARROW_RIGHT}
                    mode="aspectFit"
                    onClick={handleNextPet}
                  />
                </>
              ) : null}
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
      </ScrollView>
    </View>
  );
}
