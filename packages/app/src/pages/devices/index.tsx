import { View, Text, ScrollView } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState, useRef } from "react";
import { request } from "../../utils/request";
import type {
  Pet,
  CollarDevice,
  DesktopDevice,
  DeviceAuthorization,
} from "@pet-wechat/shared";
import "./index.scss";

export default function Devices() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [collars, setCollars] = useState<CollarDevice[]>([]);
  const [desktops, setDesktops] = useState<DesktopDevice[]>([]);
  const [receivedAuths, setReceivedAuths] = useState<DeviceAuthorization[]>([]);
  const [sentAuths, setSentAuths] = useState<DeviceAuthorization[]>([]);
  const [authLoading, setAuthLoading] = useState(false);
  const loadSeqRef = useRef(0);

  useDidShow(() => {
    loadData();
  });

  const loadData = async () => {
    const seq = ++loadSeqRef.current;
    try {
      const [petsRes, collarsRes, desktopsRes, authRes] = await Promise.all([
        request<{ pets: Pet[] }>({ url: "/api/pets" }),
        request<{ collars: CollarDevice[] }>({ url: "/api/devices/collars" }),
        request<{ desktops: DesktopDevice[] }>({ url: "/api/devices/desktops" }),
        request<{ received: DeviceAuthorization[]; sent: DeviceAuthorization[] }>({ url: "/api/devices/authorizations" }),
      ]);
      if (seq !== loadSeqRef.current) return;
      setPets(petsRes.pets);
      setCollars(collarsRes.collars);
      setDesktops(desktopsRes.desktops);
      setReceivedAuths(authRes.received);
      setSentAuths(authRes.sent);
      // Auto-select first pet if none selected or selected pet no longer exists
      if (petsRes.pets.length > 0) {
        const stillExists = petsRes.pets.some((p) => p.id === selectedPetId);
        if (!stillExists) {
          setSelectedPetId(petsRes.pets[0].id);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleAuthAction = async (id: string, status: "accepted" | "rejected") => {
    if (authLoading) return;
    setAuthLoading(true);
    try {
      await request({
        url: `/api/devices/authorizations/${id}`,
        method: "PUT",
        data: { status },
      });
      Taro.showToast({ title: status === "accepted" ? "已接受" : "已拒绝", icon: "success" });
      await loadData();
    } catch (e: any) {
      Taro.showToast({ title: e.message || "操作失败", icon: "none" });
    } finally {
      setAuthLoading(false);
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

  const getPetName = (petId: string) => {
    const pet = pets.find((p) => p.id === petId);
    return pet?.name || "未知宠物";
  };

  return (
    <View className="devices-page">
      <View className="nav-bar">
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

        {/* Authorization section */}
        {(receivedAuths.length > 0 || sentAuths.length > 0) && (
          <View className="section">
            <View className="section-title-bar">
              <Text className="section-title">授权通知</Text>
            </View>

            {receivedAuths.map((auth) => (
              <View key={auth.id} className="device-card auth-card">
                <View className="auth-header">
                  <Text className="auth-title">
                    {getPetName(auth.petId)}的授权请求
                  </Text>
                  <Text className="auth-status-tag">
                    {auth.status === "pending"
                      ? "待确认"
                      : auth.status === "accepted"
                        ? "已通过"
                        : "已拒绝"}
                  </Text>
                </View>
                {auth.status === "pending" && (
                  <View className={`auth-actions ${authLoading ? "disabled" : ""}`}>
                    <View
                      className="auth-btn accept"
                      onClick={() => handleAuthAction(auth.id, "accepted")}
                    >
                      <Text>接受</Text>
                    </View>
                    <View
                      className="auth-btn reject"
                      onClick={() => handleAuthAction(auth.id, "rejected")}
                    >
                      <Text>拒绝</Text>
                    </View>
                  </View>
                )}
              </View>
            ))}

            {sentAuths.map((auth) => (
              <View key={auth.id} className="device-card auth-card">
                <View className="auth-header">
                  <Text className="auth-title">
                    {getPetName(auth.petId)}的授权
                  </Text>
                  <Text className="auth-status-tag">
                    {auth.status === "pending"
                      ? "待确认"
                      : auth.status === "accepted"
                        ? "已通过"
                        : "已拒绝"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Add new device button */}
        <View
          className="add-device-btn"
          onClick={() => Taro.navigateTo({ url: "/pages/desktop-bind/index" })}
        >
          <Text className="add-device-text">+ 添加新设备</Text>
        </View>
        <Text className="add-device-note">
          底部"添加新设备"只能添加桌面端设备
        </Text>

        {/* Decorative cat */}
        <View className="deco-cat">
          <Text className="deco-cat-emoji">🐱</Text>
        </View>

        <View className="bottom-spacer" />
      </ScrollView>
    </View>
  );
}
