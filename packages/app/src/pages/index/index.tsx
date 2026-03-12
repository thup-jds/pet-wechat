import { View, Text, Image, Swiper, SwiperItem } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState, useMemo } from "react";
import { request } from "../../utils/request";
import { isLoggedIn } from "../../utils/storage";
import {
  ICON_PAW,
  ICON_COLLAR,
  ICON_DESKTOP,
  ICON_BATTERY,
  ICON_SIGNAL,
  ICON_BELL,
  ICON_CAT,
  ICON_DOG,
} from "../../assets/icons";
import type { Pet, CollarDevice, DesktopDevice } from "@pet-wechat/shared";
import "./index.scss";

type HomeState = "not-logged" | "no-pet" | "no-device" | "normal";

function getActivityColor(score: number): string {
  if (score < 30) return "#ff3b30";
  if (score < 70) return "#ffcc00";
  return "#34c759";
}

function getActivityLabel(score: number): string {
  if (score < 30) return "低";
  if (score < 70) return "中";
  return "高";
}

export default function Index() {
  const [ownPets, setOwnPets] = useState<Pet[]>([]);
  const [authorizedPets, setAuthorizedPets] = useState<Pet[]>([]);
  const [currentPetIndex, setCurrentPetIndex] = useState(0);
  const [collars, setCollars] = useState<CollarDevice[]>([]);
  const [desktops, setDesktops] = useState<DesktopDevice[]>([]);
  const [state, setState] = useState<HomeState>("not-logged");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const allPets = useMemo(() => [...ownPets, ...authorizedPets], [ownPets, authorizedPets]);

  useDidShow(() => {
    if (!isLoggedIn()) {
      setState("not-logged");
      return;
    }
    loadData();
  });

  const loadData = async () => {
    let own: Pet[];
    let authorized: Pet[];
    try {
      const res = await request<{ pets: Pet[]; authorizedPets: Pet[] }>({ url: "/api/pets" });
      own = res.pets;
      authorized = res.authorizedPets;
    } catch {
      Taro.showToast({ title: "网络异常，请重试", icon: "none" });
      return;
    }

    setOwnPets(own);
    setAuthorizedPets(authorized);
    const petList = [...own, ...authorized];

    if (petList.length === 0) {
      setState("no-pet");
      return;
    }

    const safeIndex = currentPetIndex >= petList.length ? 0 : currentPetIndex;
    if (safeIndex !== currentPetIndex) {
      setCurrentPetIndex(safeIndex);
    }

    try {
      const { collars: collarList } = await request<{ collars: CollarDevice[] }>({
        url: "/api/devices/collars",
      });
      setCollars(collarList);

      // TODO: 后端暂无桌面设备列表接口，待实现后取消注释并加入判断
      // const { desktops: desktopList } = await request<{ desktops: DesktopDevice[] }>({
      //   url: "/api/devices/desktops",
      // });
      // setDesktops(desktopList);

      // 判断是否有设备配置（目前仅检查项圈，桌面端接口待实现）
      if (collarList.length === 0 && desktops.length === 0) {
        setState("no-device");
      } else {
        setState("normal");
      }
    } catch {
      setState("normal");
    }
  };

  const currentPet = allPets[currentPetIndex];
  const activityScore = currentPet?.activityScore ?? 0;
  const activityColor = getActivityColor(activityScore);
  const isAuthorizedPet = authorizedPets.some((p) => currentPet && p.id === currentPet.id);
  const petIcon = currentPet?.species === "dog" ? ICON_DOG : ICON_CAT;

  const handleSwiperChange = (e) => {
    setCurrentPetIndex(e.detail.current);
  };

  // --- 未登录状态 ---
  if (state === "not-logged") {
    return (
      <View className="home-page">
        <View className="empty-state">
          <Image className="empty-icon" src={ICON_PAW} mode="aspectFit" />
          <Text className="empty-text">登录后查看你的宠物</Text>
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

  // --- 无宠物状态 (设计稿 c9sf4) ---
  if (state === "no-pet") {
    return (
      <View className="home-page">
        <View className="top-bar">
          <View className="pet-profile">
            <View className="pet-avatar-circle empty">
              <Image className="avatar-icon" src={ICON_CAT} mode="aspectFit" />
            </View>
            <View className="pet-info">
              <Text className="pet-name">宠物的昵称</Text>
            </View>
          </View>
        </View>

        <View className="center-area">
          <View className="activity-bar">
            <Text className="activity-label">活跃值</Text>
            <View className="activity-track">
              <View className="activity-fill" style={{ height: "0%", background: "#ccc" }} />
            </View>
          </View>
          <View className="pet-photo-wrapper">
            {/* TODO: 替换为真实猫咪占位图 (image-import-31.png) */}
            <View className="pet-photo empty" onClick={() => Taro.navigateTo({ url: "/pages/pet-info/index" })}>
              <Image className="pet-photo-icon" src={ICON_CAT} mode="aspectFit" />
              <Text className="pet-photo-hint">点击添加宠物</Text>
            </View>
          </View>
        </View>

        {/* 设备引导卡片 (设计稿 c9sf4 底部) */}
        <View className="device-cards">
          <View
            className="device-card empty"
            onClick={() => Taro.navigateTo({ url: "/pages/collar-bind/index" })}
          >
            <Image className="device-card-icon" src={ICON_COLLAR} mode="aspectFit" />
            <Text className="device-card-label">项圈</Text>
            <Text className="device-card-hint">点击此处配置项圈</Text>
          </View>
          <View
            className="device-card empty"
            onClick={() => Taro.navigateTo({ url: "/pages/desktop-bind/index" })}
          >
            <Image className="device-card-icon" src={ICON_DESKTOP} mode="aspectFit" />
            <Text className="device-card-label">桌面端</Text>
            <Text className="device-card-hint">点击此处配置桌面端</Text>
          </View>
        </View>
      </View>
    );
  }

  const currentCollar = collars.find(
    (c) => currentPet && c.petId === currentPet.id
  );

  // TODO: 桌面设备关联逻辑待实现
  const onlineDesktopCount = desktops.filter((d) => d.status === "online").length;

  // TODO: 语音气泡文案待接入后端数据
  const speechText = state === "no-device"
    ? "主人，我要装上项圈，住进大House"
    : "主人！不给我开空调！我要反天！";

  // 是否显示"未配置设备"引导
  const showDeviceGuide = state === "no-device";

  return (
    <View className="home-page">
      {/* 顶部区域 */}
      <View className="top-bar">
        <View className="pet-profile">
          {/* TODO: 接入宠物头像图片 URL (image-import-52.png) */}
          <View className="pet-avatar-circle">
            <Image className="avatar-icon" src={petIcon} mode="aspectFit" />
          </View>
          <View className="pet-info">
            <Text className="pet-name">{currentPet?.name || "宠物"}</Text>
            <Text className="pet-subtitle">
              {isAuthorizedPet ? "被授权的宠物" : "属于你的宠物"}
            </Text>
          </View>
        </View>
        <View
          className="notification-icon"
          onClick={() => Taro.switchTab({ url: "/pages/messages/index" })}
        >
          <Image className="notification-bell-img" src={ICON_BELL} mode="aspectFit" />
          {/* TODO: 接入未读消息数判断是否显示红点 */}
          <View className="notification-dot" />
        </View>
      </View>

      {/* 中间区域 */}
      <View className="center-area">
        {/* 左侧活跃值 */}
        <View className="activity-bar">
          <Text className="activity-label">活跃值</Text>
          <View className="activity-track">
            <View
              className="activity-fill"
              style={{
                height: `${Math.min(activityScore, 100)}%`,
                background: activityColor,
              }}
            />
          </View>
          <View className="activity-score-badge" style={{ background: activityColor }}>
            <Text className="activity-score-text">{Math.round(activityScore)}</Text>
          </View>
          <Text className="activity-level" style={{ color: activityColor }}>
            {getActivityLabel(activityScore)}
          </Text>
        </View>

        {/* 宠物大图区域 */}
        <View className="pet-photo-wrapper">
          <View className="speech-bubble">
            <Text className="speech-text">{speechText}</Text>
            <View className="speech-arrow" />
          </View>

          {allPets.length > 1 ? (
            <Swiper
              className="pet-swiper"
              current={currentPetIndex}
              onChange={handleSwiperChange}
            >
              {allPets.map((pet) => (
                <SwiperItem key={pet.id}>
                  <View className="pet-photo">
                    {/* TODO: 接入宠物形象大图 URL */}
                    <Image className="pet-photo-icon" src={pet.species === "dog" ? ICON_DOG : ICON_CAT} mode="aspectFit" />
                  </View>
                </SwiperItem>
              ))}
            </Swiper>
          ) : (
            <View className="pet-photo">
              {/* TODO: 接入宠物形象大图 URL */}
              <Image className="pet-photo-icon" src={petIcon} mode="aspectFit" />
            </View>
          )}

          {allPets.length > 1 && (
            <View className="swiper-dots">
              {allPets.map((pet, idx) => (
                <View
                  key={pet.id}
                  className={`swiper-dot ${idx === currentPetIndex ? "active" : ""}`}
                />
              ))}
            </View>
          )}
        </View>
      </View>

      {/* 底部设备卡片 */}
      <View className="device-cards">
        {showDeviceGuide ? (
          <>
            {/* 设计稿 QfXnu: 未配置设备引导 */}
            <View
              className="device-card empty"
              onClick={() => Taro.navigateTo({ url: "/pages/collar-bind/index" })}
            >
              <Image className="device-card-icon" src={ICON_COLLAR} mode="aspectFit" />
              <Text className="device-card-label">项圈</Text>
              <Text className="device-card-hint">点击此处配置项圈</Text>
            </View>
            <View
              className="device-card empty"
              onClick={() => Taro.navigateTo({ url: "/pages/desktop-bind/index" })}
            >
              <Image className="device-card-icon" src={ICON_DESKTOP} mode="aspectFit" />
              <Text className="device-card-label">桌面端</Text>
              <Text className="device-card-hint">点击此处配置桌面端</Text>
            </View>
          </>
        ) : (
          <>
            <View className="device-card" onClick={() => Taro.switchTab({ url: "/pages/devices/index" })}>
              <View className="device-card-header">
                <Image className="device-icon-img" src={ICON_COLLAR} mode="aspectFit" />
                <Text className="device-name">
                  {currentCollar?.name || `${currentPet?.name || "宠物"}的小圈圈`}
                </Text>
              </View>
              <View className="device-card-status">
                <View
                  className={`status-dot ${currentCollar?.status === "online" ? "online" : "offline"}`}
                />
                <Text className="status-text">
                  {currentCollar
                    ? currentCollar.status === "online" ? "在线" : "离线"
                    : "未绑定"}
                </Text>
                {currentCollar?.battery != null && (
                  <View className="battery-info">
                    <Image className="status-icon" src={ICON_BATTERY} mode="aspectFit" />
                    <Text className="status-value">{currentCollar.battery}%</Text>
                  </View>
                )}
                {currentCollar?.signal != null && (
                  <View className="signal-info">
                    <Image className="status-icon" src={ICON_SIGNAL} mode="aspectFit" />
                    <Text className="status-value">{currentCollar.signal}%</Text>
                  </View>
                )}
              </View>
            </View>

            <View className="device-card" onClick={() => Taro.switchTab({ url: "/pages/devices/index" })}>
              <View className="device-card-header">
                <Image className="device-icon-img" src={ICON_DESKTOP} mode="aspectFit" />
                <Text className="device-name">
                  {`${currentPet?.name || "宠物"}的秘密基地`}
                </Text>
              </View>
              <View className="device-card-status">
                <View className={`status-dot ${onlineDesktopCount > 0 ? "online" : "offline"}`} />
                <Text className="status-text">
                  {onlineDesktopCount > 0
                    ? `${onlineDesktopCount}个在线设备`
                    : "无在线设备"}
                </Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* 右侧管理设备侧边栏触发器 */}
      <View className="sidebar-trigger" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <Text className="sidebar-text">管</Text>
        <Text className="sidebar-text">理</Text>
        <Text className="sidebar-text">设</Text>
        <Text className="sidebar-text">备</Text>
      </View>

      {/* 侧边栏弹出层 */}
      {sidebarOpen && (
        <View className="sidebar-overlay" onClick={() => setSidebarOpen(false)}>
          <View className="sidebar-panel" onClick={(e) => e.stopPropagation()}>
            <Text className="sidebar-title">设备管理</Text>
            <View
              className="sidebar-item"
              onClick={() => {
                setSidebarOpen(false);
                Taro.switchTab({ url: "/pages/devices/index" });
              }}
            >
              <Text>查看所有设备</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
