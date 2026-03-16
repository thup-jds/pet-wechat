import { View, Text, ScrollView } from "@tarojs/components";
import Taro, { useDidShow, useShareAppMessage } from "@tarojs/taro";
import { useState, useRef } from "react";
import { request } from "../../utils/request";
import type {
  Pet,
  CollarDevice,
  DesktopDevice,
} from "@pet-wechat/shared";
import "./index.scss";

export default function Devices() {
  const statusBarHeight = Taro.getSystemInfoSync().statusBarHeight ?? 20;
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [shareInfo, setShareInfo] = useState<{ path: string; title: string } | null>(null);

  useShareAppMessage(() => {
    if (shareInfo) {
      return { title: shareInfo.title, path: shareInfo.path };
    }
    return { title: "YEHEY 宠物在场", path: "/pages/index/index" };
  });
  const [collars, setCollars] = useState<CollarDevice[]>([]);
  const [desktops, setDesktops] = useState<DesktopDevice[]>([]);
  const loadSeqRef = useRef(0);

  useDidShow(() => {
    loadData();
  });

  const loadData = async () => {
    const seq = ++loadSeqRef.current;
    try {
      const [petsRes, collarsRes, desktopsRes] = await Promise.all([
        request<{ pets: Pet[] }>({ url: "/api/pets" }),
        request<{ collars: CollarDevice[] }>({ url: "/api/devices/collars" }),
        request<{ desktops: DesktopDevice[] }>({ url: "/api/devices/desktops" }),
      ]);
      if (seq !== loadSeqRef.current) return;
      setPets(petsRes.pets);
      setCollars(collarsRes.collars);
      setDesktops(desktopsRes.desktops);
      // Auto-select first pet if none selected or selected pet no longer exists
      if (petsRes.pets.length > 0) {
        const stillExists = petsRes.pets.some((p) => p.id === selectedPetId);
        if (!stillExists) {
          setSelectedPetId(petsRes.pets[0].id);
        }
      } else {
        setSelectedPetId(null);
      }
    } catch {
      // ignore
    }
  };

  const handleShare = async (petId: string) => {
    try {
      const res = await request<{ inviteCode: string }>({
        url: "/api/devices/invite",
        method: "POST",
        data: { petId },
      });
      const sharePath = `/pages/invite/index?code=${encodeURIComponent(res.inviteCode)}`;
      const title = `${selectedPet?.name ?? "我的宠物"}邀请你查看 TA 的宠物空间`;
      setShareInfo({ path: sharePath, title });

      // 触发微信转发菜单
      Taro.showShareMenu({ withShareTicket: false });
      Taro.showToast({ title: "请点击右上角「...」转发给好友", icon: "none", duration: 3000 });
    } catch (e: any) {
      Taro.showToast({ title: e.message || "分享失败", icon: "none" });
    }
  };

  const selectedPet = pets.find((p) => p.id === selectedPetId) || null;

  const petCollars = selectedPet
    ? collars.filter((c) => c.petId === selectedPet.id)
    : collars;

  const formatAge = (birthday: string | null) => {
    if (!birthday) return "";
    const birth = new Date(birthday);
    const now = new Date();
    if (Number.isNaN(birth.getTime()) || birth > now) return "";
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    const years = Math.floor(months / 12);
    const remainMonths = months % 12;
    if (years > 0 && remainMonths > 0) return `${years}岁${remainMonths > 6 ? "半" : ""}`;
    if (years > 0) return `${years}岁`;
    return `${remainMonths}个月`;
  };

  const breedText = (pet: Pet) => {
    const parts: string[] = [];
    if (pet.breed) parts.push(pet.breed);
    if (pet.birthday) parts.push(formatAge(pet.birthday));
    return parts.join(" ");
  };

  const switchPet = () => {
    if (pets.length <= 1) return;
    const currentIndex = pets.findIndex((p) => p.id === selectedPetId);
    const nextIndex = (currentIndex + 1) % pets.length;
    setSelectedPetId(pets[nextIndex].id);
  };

  return (
    <View className="devices-page">
      <View className="nav-bar" style={{ paddingTop: `${statusBarHeight}px` }}>
        <Text className="nav-title">我的设备</Text>
      </View>

      <ScrollView className="device-content" scrollY>
        {/* Pet card switcher */}
        {pets.length > 0 && (
          <View className="pet-switcher" onClick={switchPet}>
            <View className="pet-switcher-inner">
              <View className="pet-avatar-placeholder">
                <Text className="pet-avatar-text">
                  {selectedPet?.name?.[0] || "?"}
                </Text>
              </View>
              <Text className="pet-switcher-name">{selectedPet?.name}</Text>
              {pets.length > 1 && <Text className="pet-switcher-arrow">▸</Text>}
            </View>
            {selectedPet && (
              <View
                className="share-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare(selectedPet.id);
                }}
              >
                <Text className="share-btn-text">分享</Text>
              </View>
            )}
          </View>
        )}

        {/* Collar section */}
        <View className="section">
          <View className="section-title-bar">
            <Text className="section-title">
              {selectedPet ? `${selectedPet.name}的小圈圈` : "项圈"}
            </Text>
            <Text className="section-subtitle">(你的项圈)</Text>
          </View>

          {petCollars.length === 0 ? (
            <View className="empty-card">
              <Text className="empty-text">暂无项圈设备</Text>
            </View>
          ) : (
            petCollars.map((collar) => {
              const pet = pets.find((p) => p.id === collar.petId);
              return (
                <View key={collar.id} className="device-card">
                  <View className="collar-status-row">
                    <View className="status-indicator-wrap">
                      <View
                        className={`status-dot ${collar.status === "online" ? "online" : collar.status === "pairing" ? "pairing" : "offline"}`}
                      />
                      <Text className="status-label">
                        {collar.status === "online" ? "在线" : collar.status === "pairing" ? "配对中" : "离线"}
                      </Text>
                    </View>
                    <View className="battery-wrap">
                      <View className="battery-icon">
                        <View
                          className="battery-fill"
                          style={{ width: `${Math.min(collar.battery ?? 0, 100)}%` }}
                        />
                      </View>
                      <Text className="battery-text">{collar.battery ?? "--"}%</Text>
                    </View>
                  </View>
                  {pet && (
                    <View className="collar-pet-info">
                      <Text className="collar-pet-label">
                        关联宠物：{pet.name}，{breedText(pet)}
                      </Text>
                    </View>
                  )}
                  {pets.length > 1 && (
                    <Text className="switch-pet-link" onClick={switchPet}>
                      切换到其他宠物
                    </Text>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Desktop section */}
        <View className="section">
          <View className="section-title-bar">
            <Text className="section-title">
              {selectedPet ? `${selectedPet.name}的秘密基地` : "桌面端"}
            </Text>
          </View>

          {desktops.length === 0 ? (
            <View className="empty-card">
              <Text className="empty-text">暂无桌面端设备</Text>
            </View>
          ) : (
            desktops.map((desktop) => (
              <View key={desktop.id} className="device-card desktop-card">
                <View className="desktop-row">
                  <View className="desktop-icon-wrap">
                    <Text className="desktop-icon-text">🖥</Text>
                  </View>
                  <View className="desktop-info">
                    <Text className="desktop-name">{desktop.name}</Text>
                    <Text
                      className={`desktop-status ${desktop.status}`}
                    >
                      {desktop.status === "online" ? "已绑定" : desktop.status === "pairing" ? "配对中" : "离线"}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Add new device button */}
        <View
          className="add-device-btn"
          onClick={() => {
            Taro.showActionSheet({
              itemList: ["添加项圈", "添加桌面端"],
              success: (res) => {
                if (res.tapIndex === 0) {
                  Taro.navigateTo({ url: "/pages/collar-bind/index" });
                } else {
                  Taro.navigateTo({ url: "/pages/desktop-bind/index" });
                }
              },
            });
          }}
        >
          <Text className="add-device-text">+ 添加新设备</Text>
        </View>

        {/* Decorative cat */}
        <View className="deco-cat">
          <Text className="deco-cat-emoji">🐱</Text>
        </View>

        <View className="bottom-spacer" />
      </ScrollView>
    </View>
  );
}
