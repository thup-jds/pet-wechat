import { View, Text, Swiper, SwiperItem } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { request } from "../../utils/request";
import { isLoggedIn } from "../../utils/storage";
import type { Pet, CollarDevice, DesktopDevice, PetBehavior } from "@pet-wechat/shared";
import "./index.scss";

type HomeState = "not-logged" | "no-pet" | "waiting" | "normal";

export default function Index() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [currentPetIndex, setCurrentPetIndex] = useState(0);
  const [collars, setCollars] = useState<CollarDevice[]>([]);
  const [desktops, setDesktops] = useState<DesktopDevice[]>([]);
  const [behaviors, setBehaviors] = useState<PetBehavior[]>([]);
  const [state, setState] = useState<HomeState>("not-logged");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useDidShow(() => {
    if (!isLoggedIn()) {
      setState("not-logged");
      return;
    }
    loadData();
  });

  const loadData = async () => {
    let petList: Pet[];
    try {
      const res = await request<{ pets: Pet[] }>({ url: "/api/pets" });
      petList = res.pets;
    } catch {
      // 网络错误时保持当前状态，不误判为无宠物
      Taro.showToast({ title: "网络异常，请重试", icon: "none" });
      return;
    }

    setPets(petList);
    if (petList.length === 0) {
      setState("no-pet");
      return;
    }

    setState("normal");

    try {
      const { collars: collarList } = await request<{ collars: CollarDevice[] }>({
        url: "/api/devices/collars",
      });
      setCollars(collarList);

      // TODO: 后端暂无桌面设备列表接口，待实现
      // const { desktops: desktopList } = await request<{ desktops: DesktopDevice[] }>({
      //   url: "/api/devices/desktops",
      // });
      // setDesktops(desktopList);

      const pet = petList[currentPetIndex];
      if (pet) {
        const { behaviors: behaviorList } = await request<{ behaviors: PetBehavior[] }>({
          url: `/api/behaviors/${pet.id}`,
        });
        setBehaviors(behaviorList);
      }
    } catch {
      // 设备/行为数据加载失败不影响主页显示
    }
  };

  const currentPet = pets[currentPetIndex];

  if (state === "not-logged") {
    return (
      <View className="home-page">
        <View className="empty-state">
          <Text className="empty-emoji">🐾</Text>
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

  if (state === "no-pet") {
    return (
      <View className="home-page">
        <View className="empty-state">
          <Text className="empty-emoji">🐱</Text>
          <Text className="empty-text">还没有添加宠物</Text>
          <Text className="empty-desc">绑定项圈，开始记录宠物的每一天</Text>
          <View
            className="btn-primary"
            onClick={() =>
              Taro.navigateTo({ url: "/pages/collar-bind/index" })
            }
          >
            绑定项圈
          </View>
          <View
            className="btn-secondary"
            onClick={() =>
              Taro.navigateTo({ url: "/pages/pet-info/index" })
            }
          >
            先添加宠物
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

  const handleSwiperChange = async (e) => {
    const idx = e.detail.current;
    setCurrentPetIndex(idx);
    const pet = pets[idx];
    if (pet) {
      const { behaviors: behaviorList } = await request<{ behaviors: PetBehavior[] }>({
        url: `/api/behaviors/${pet.id}`,
      });
      setBehaviors(behaviorList);
    }
  };

  // TODO: 语音气泡文案待接入后端数据
  const speechText = "主人！不给我开空调！我要反天！";

  return (
    <View className="home-page">
      {/* 顶部区域：宠物头像 + 名称 + 消息通知 */}
      <View className="top-bar">
        <View className="pet-profile">
          {/* TODO: 接入宠物头像图片 URL */}
          <View className="pet-avatar-circle">
            <Text className="pet-avatar-placeholder">
              {currentPet?.species === "cat" ? "🐱" : "🐶"}
            </Text>
          </View>
          <View className="pet-info">
            <Text className="pet-name">{currentPet?.name || "宠物"}</Text>
            <Text className="pet-subtitle">属于你的宠物</Text>
          </View>
        </View>
        <View
          className="notification-icon"
          onClick={() => Taro.switchTab({ url: "/pages/messages/index" })}
        >
          {/* TODO: 替换为实际消息图标 */}
          <Text className="notification-bell">🔔</Text>
          {/* TODO: 接入未读消息数判断是否显示红点 */}
          <View className="notification-dot" />
        </View>
      </View>

      {/* 中间区域：宠物大图 + 语音气泡 + 活跃值 */}
      <View className="center-area">
        {/* 左侧活跃值 */}
        <View className="activity-bar">
          <Text className="activity-label">活跃值</Text>
          <View className="activity-track">
            {/* TODO: activityScore 范围待确认，暂按百分比处理 */}
            <View
              className="activity-fill"
              style={{ height: `${Math.min(currentPet?.activityScore || 0, 100)}%` }}
            />
          </View>
        </View>

        {/* 宠物大图区域 */}
        <View className="pet-photo-wrapper">
          <View className="speech-bubble">
            <Text className="speech-text">{speechText}</Text>
            <View className="speech-arrow" />
          </View>

          {pets.length > 1 ? (
            <Swiper
              className="pet-swiper"
              current={currentPetIndex}
              onChange={handleSwiperChange}
            >
              {pets.map((pet) => (
                <SwiperItem key={pet.id}>
                  <View className="pet-photo">
                    {/* TODO: 接入宠物形象大图 URL */}
                    <Text className="pet-photo-placeholder">
                      {pet.species === "cat" ? "🐱" : "🐶"}
                    </Text>
                  </View>
                </SwiperItem>
              ))}
            </Swiper>
          ) : (
            <View className="pet-photo">
              {/* TODO: 接入宠物形象大图 URL */}
              <Text className="pet-photo-placeholder">
                {currentPet?.species === "cat" ? "🐱" : "🐶"}
              </Text>
            </View>
          )}

          {pets.length > 1 && (
            <View className="swipe-hint">
              <Text className="swipe-arrow">{"<"}</Text>
              <Text className="swipe-text">左右滑动切换宠物</Text>
              <Text className="swipe-arrow">{">"}</Text>
            </View>
          )}
        </View>
      </View>

      {/* 底部设备卡片 */}
      <View className="device-cards">
        <View className="device-card" onClick={() => Taro.switchTab({ url: "/pages/devices/index" })}>
          <View className="device-card-header">
            {/* TODO: 替换为项圈设备图标 */}
            <Text className="device-icon">📿</Text>
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
                ? currentCollar.status === "online"
                  ? "在线"
                  : "离线"
                : "未绑定"}
            </Text>
            {currentCollar?.battery != null && (
              <Text className="battery-text">{currentCollar.battery}%</Text>
            )}
          </View>
        </View>

        <View className="device-card" onClick={() => Taro.switchTab({ url: "/pages/devices/index" })}>
          <View className="device-card-header">
            {/* TODO: 替换为桌面设备图标 */}
            <Text className="device-icon">🖥️</Text>
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
