import { View, Text, Swiper, SwiperItem } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState, useMemo } from "react";
import { request } from "../../utils/request";
import { isLoggedIn } from "../../utils/storage";
import type { Pet, CollarDevice, DesktopDevice, PetBehavior } from "@pet-wechat/shared";
import "./index.scss";

type HomeState = "not-logged" | "no-pet" | "waiting" | "normal";

const ACTION_EMOJIS: Record<string, string> = {
  sleeping: "\u{1F634}",
  lying: "\u{1F6CB}\uFE0F",
  standing: "\u{1F9CD}",
  walking: "\u{1F6B6}",
};

const ACTION_LABELS: Record<string, string> = {
  sleeping: "\u7761\u89C9\u4E2D",
  lying: "\u8D96\u7740",
  standing: "\u7AD9\u7740",
  walking: "\u6563\u6B65\u4E2D",
};

function getActivityColor(score: number): string {
  if (score < 30) return "#ff3b30";
  if (score < 70) return "#ffcc00";
  return "#34c759";
}

function getActivityLabel(score: number): string {
  if (score < 30) return "\u4F4E";
  if (score < 70) return "\u4E2D";
  return "\u9AD8";
}

export default function Index() {
  const [ownPets, setOwnPets] = useState<Pet[]>([]);
  const [authorizedPets, setAuthorizedPets] = useState<Pet[]>([]);
  const [currentPetIndex, setCurrentPetIndex] = useState(0);
  const [collars, setCollars] = useState<CollarDevice[]>([]);
  const [desktops, setDesktops] = useState<DesktopDevice[]>([]);
  const [behaviors, setBehaviors] = useState<PetBehavior[]>([]);
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
      Taro.showToast({ title: "\u7F51\u7EDC\u5F02\u5E38\uFF0C\u8BF7\u91CD\u8BD5", icon: "none" });
      return;
    }

    setOwnPets(own);
    setAuthorizedPets(authorized);
    const petList = [...own, ...authorized];

    if (petList.length === 0) {
      setState("no-pet");
      return;
    }

    // 防止切换后宠物列表变短导致越界
    const safeIndex = currentPetIndex >= petList.length ? 0 : currentPetIndex;
    if (safeIndex !== currentPetIndex) {
      setCurrentPetIndex(safeIndex);
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

      const pet = petList[safeIndex];
      if (pet) {
        await loadBehaviors(pet.id);
      }
    } catch {
      // 设备/行为数据加载失败不影响主页显示
    }
  };

  const loadBehaviors = async (petId: string) => {
    try {
      const { behaviors: behaviorList } = await request<{ behaviors: PetBehavior[] }>({
        url: `/api/behaviors/${petId}`,
      });
      setBehaviors(behaviorList);
    } catch {
      setBehaviors([]);
    }
  };

  const currentPet = allPets[currentPetIndex];

  // 根据最新行为推断当前动作
  const currentAction = useMemo(() => {
    if (behaviors.length === 0) return "standing";
    return behaviors[0]?.actionType || "standing";
  }, [behaviors]);

  const activityScore = currentPet?.activityScore ?? 0;
  const activityColor = getActivityColor(activityScore);

  if (state === "not-logged") {
    return (
      <View className="home-page">
        <View className="empty-state">
          <Text className="empty-emoji">{"\u{1F43E}"}</Text>
          <Text className="empty-text">{"\u767B\u5F55\u540E\u67E5\u770B\u4F60\u7684\u5BA0\u7269"}</Text>
          <View
            className="btn-primary"
            onClick={() => Taro.navigateTo({ url: "/pages/login/index" })}
          >
            {"\u53BB\u767B\u5F55"}
          </View>
        </View>
      </View>
    );
  }

  if (state === "no-pet") {
    return (
      <View className="home-page">
        <View className="empty-state">
          <Text className="empty-emoji">{"\u{1F431}"}</Text>
          <Text className="empty-text">{"\u8FD8\u6CA1\u6709\u6DFB\u52A0\u5BA0\u7269"}</Text>
          <Text className="empty-desc">{"\u7ED1\u5B9A\u9879\u5708\uFF0C\u5F00\u59CB\u8BB0\u5F55\u5BA0\u7269\u7684\u6BCF\u4E00\u5929"}</Text>
          <View
            className="btn-primary"
            onClick={() =>
              Taro.navigateTo({ url: "/pages/collar-bind/index" })
            }
          >
            {"\u7ED1\u5B9A\u9879\u5708"}
          </View>
          <View
            className="btn-secondary"
            onClick={() =>
              Taro.navigateTo({ url: "/pages/pet-info/index" })
            }
          >
            {"\u5148\u6DFB\u52A0\u5BA0\u7269"}
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

  const isAuthorizedPet = authorizedPets.some((p) => currentPet && p.id === currentPet.id);

  const handleSwiperChange = async (e) => {
    const idx = e.detail.current;
    setCurrentPetIndex(idx);
    const pet = allPets[idx];
    if (pet) {
      await loadBehaviors(pet.id);
    }
  };

  // TODO: 语音气泡文案待接入后端数据
  const speechText = "\u4E3B\u4EBA\uFF01\u4E0D\u7ED9\u6211\u5F00\u7A7A\u8C03\uFF01\u6211\u8981\u53CD\u5929\uFF01";

  return (
    <View className="home-page">
      {/* 顶部区域：宠物头像 + 名称 + 消息通知 */}
      <View className="top-bar">
        <View className="pet-profile">
          {/* TODO: 接入宠物头像图片 URL */}
          <View className="pet-avatar-circle">
            <Text className="pet-avatar-placeholder">
              {currentPet?.species === "cat" ? "\u{1F431}" : "\u{1F436}"}
            </Text>
          </View>
          <View className="pet-info">
            <Text className="pet-name">{currentPet?.name || "\u5BA0\u7269"}</Text>
            <Text className="pet-subtitle">
              {isAuthorizedPet ? "\u6388\u6743\u5BA0\u7269" : "\u5C5E\u4E8E\u4F60\u7684\u5BA0\u7269"}
            </Text>
          </View>
        </View>
        <View
          className="notification-icon"
          onClick={() => Taro.switchTab({ url: "/pages/messages/index" })}
        >
          {/* TODO: 替换为实际消息图标 */}
          <Text className="notification-bell">{"\u{1F514}"}</Text>
          {/* TODO: 接入未读消息数判断是否显示红点 */}
          <View className="notification-dot" />
        </View>
      </View>

      {/* 宠物 Swiper 切换区域 */}
      <View className="pet-swiper-section">
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

      {/* 中间区域：宠物大图 + 语音气泡 + 活跃值 */}
      <View className="center-area">
        {/* 左侧活跃值 */}
        <View className="activity-bar">
          <Text className="activity-label">{"\u6D3B\u8DC3\u503C"}</Text>
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
                    <Text className="pet-photo-placeholder">
                      {pet.species === "cat" ? "\u{1F431}" : "\u{1F436}"}
                    </Text>
                  </View>
                </SwiperItem>
              ))}
            </Swiper>
          ) : (
            <View className="pet-photo">
              {/* TODO: 接入宠物形象大图 URL */}
              <Text className="pet-photo-placeholder">
                {currentPet?.species === "cat" ? "\u{1F431}" : "\u{1F436}"}
              </Text>
            </View>
          )}

          {allPets.length > 1 && (
            <View className="swipe-hint">
              <Text className="swipe-arrow">{"<"}</Text>
              <Text className="swipe-text">{"\u5DE6\u53F3\u6ED1\u52A8\u5207\u6362\u5BA0\u7269"}</Text>
              <Text className="swipe-arrow">{">"}</Text>
            </View>
          )}
        </View>
      </View>

      {/* 宠物动态（行为状态） */}
      <View className="behavior-section">
        <Text className="behavior-section-title">{"\u5B9E\u65F6\u52A8\u6001"}</Text>
        <View className="behavior-actions">
          {(["sleeping", "lying", "standing", "walking"] as const).map((action) => (
            <View
              key={action}
              className={`behavior-action-item ${currentAction === action ? "active" : ""}`}
            >
              <Text className="behavior-action-emoji">{ACTION_EMOJIS[action]}</Text>
              <Text className={`behavior-action-label ${currentAction === action ? "active" : ""}`}>
                {ACTION_LABELS[action]}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 底部设备卡片 */}
      <View className="device-cards">
        <View className="device-card" onClick={() => Taro.switchTab({ url: "/pages/devices/index" })}>
          <View className="device-card-header">
            {/* TODO: 替换为项圈设备图标 */}
            <Text className="device-icon">{"\u{1F4FF}"}</Text>
            <Text className="device-name">
              {currentCollar?.name || `${currentPet?.name || "\u5BA0\u7269"}\u7684\u5C0F\u5708\u5708`}
            </Text>
          </View>
          <View className="device-card-status">
            <View
              className={`status-dot ${currentCollar?.status === "online" ? "online" : "offline"}`}
            />
            <Text className="status-text">
              {currentCollar
                ? currentCollar.status === "online"
                  ? "\u5728\u7EBF"
                  : "\u79BB\u7EBF"
                : "\u672A\u7ED1\u5B9A"}
            </Text>
            {currentCollar?.battery != null && (
              <Text className="battery-text">
                {"\u{1F50B}"} {currentCollar.battery}%
              </Text>
            )}
            {currentCollar?.signal != null && (
              <Text className="signal-text">
                {"\u{1F4F6}"} {currentCollar.signal}%
              </Text>
            )}
          </View>
        </View>

        <View className="device-card" onClick={() => Taro.switchTab({ url: "/pages/devices/index" })}>
          <View className="device-card-header">
            {/* TODO: 替换为桌面设备图标 */}
            <Text className="device-icon">{"\u{1F5A5}\uFE0F"}</Text>
            <Text className="device-name">
              {`${currentPet?.name || "\u5BA0\u7269"}\u7684\u79D8\u5BC6\u57FA\u5730`}
            </Text>
          </View>
          <View className="device-card-status">
            <View className={`status-dot ${onlineDesktopCount > 0 ? "online" : "offline"}`} />
            <Text className="status-text">
              {onlineDesktopCount > 0
                ? `${onlineDesktopCount}\u4E2A\u5728\u7EBF\u8BBE\u5907`
                : "\u65E0\u5728\u7EBF\u8BBE\u5907"}
            </Text>
          </View>
        </View>
      </View>

      {/* 右侧管理设备侧边栏触发器 */}
      <View className="sidebar-trigger" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <Text className="sidebar-text">{"\u7BA1"}</Text>
        <Text className="sidebar-text">{"\u7406"}</Text>
        <Text className="sidebar-text">{"\u8BBE"}</Text>
        <Text className="sidebar-text">{"\u5907"}</Text>
      </View>

      {/* 侧边栏弹出层 */}
      {sidebarOpen && (
        <View className="sidebar-overlay" onClick={() => setSidebarOpen(false)}>
          <View className="sidebar-panel" onClick={(e) => e.stopPropagation()}>
            <Text className="sidebar-title">{"\u8BBE\u5907\u7BA1\u7406"}</Text>
            <View
              className="sidebar-item"
              onClick={() => {
                setSidebarOpen(false);
                Taro.switchTab({ url: "/pages/devices/index" });
              }}
            >
              <Text>{"\u67E5\u770B\u6240\u6709\u8BBE\u5907"}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
