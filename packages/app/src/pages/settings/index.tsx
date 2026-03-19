import { View, Text, Image } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { clearToken, request } from "../../utils/request";
import { disconnectWs } from "../../utils/ws";
import NavBar from "../../components/NavBar";
import {
  ICON_CAT,
  ICON_PLUS,
  ICON_ARROW_RIGHT,
  ICON_NOTIFICATION,
  ICON_SHIELD,
  ICON_PALETTE,
  ICON_GLOBE,
  ICON_INFO,
  ICON_HELP,
  ICON_DOCUMENT,
} from "../../assets/icons";
import type { Pet } from "@pet-wechat/shared";
import "./index.scss";

export default function Settings() {
  const [pets, setPets] = useState<Pet[]>([]);

  useDidShow(() => {
    loadPets();
  });

  const loadPets = async () => {
    try {
      const res = await request<{ pets: Pet[] }>({ url: "/api/pets" });
      setPets(res.pets);
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    disconnectWs();
    clearToken();
    Taro.removeStorageSync("userInfo");
    Taro.showToast({ title: "已退出登录", icon: "success" });
    setTimeout(() => {
      Taro.reLaunch({ url: "/pages/login/index" });
    }, 1000);
  };

  const showComingSoon = () => {
    Taro.showToast({ title: "功能开发中", icon: "none" });
  };

  const handleCollectData = async () => {
    try {
      const result = await request<Record<string, unknown>>({
        url: "/api/debug/collect-data",
      });
      Taro.showModal({
        title: "采集对照数据",
        content: JSON.stringify(result, null, 2),
        showCancel: false,
      });
    } catch (e: any) {
      Taro.showToast({ title: e.message || "请求失败", icon: "none" });
    }
  };

  const menuItems = [
    { label: "通知设置", icon: ICON_NOTIFICATION },
    { label: "隐私设置", icon: ICON_SHIELD },
    { label: "主题设置", icon: ICON_PALETTE },
    { label: "语言选择", icon: ICON_GLOBE },
  ];

  const infoItems = [
    { label: "关于我们", icon: ICON_INFO },
    { label: "帮助与反馈", icon: ICON_HELP },
    { label: "隐私政策", icon: ICON_DOCUMENT },
  ];

  return (
    <View className="settings-page">
      <NavBar title="设置" showBack />

      <View className="settings-content">
        {/* My pets section */}
        <View className="pets-section">
          <Text className="section-label">我的宠物</Text>
          <View className="pets-row">
            {pets.map((pet) => (
              <View
                key={pet.id}
                className="pet-thumb"
                onClick={() =>
                  Taro.navigateTo({ url: `/pages/pet-info/index?id=${pet.id}` })
                }
              >
                <View className="pet-thumb-avatar">
                  <Text className="pet-thumb-initial">{pet.name[0]}</Text>
                </View>
                <Text className="pet-thumb-name">{pet.name}</Text>
              </View>
            ))}
            <View
              className="pet-thumb add-pet"
              onClick={() => Taro.navigateTo({ url: "/pages/pet-info/index" })}
            >
              <View className="pet-thumb-avatar add">
                <Image className="pet-thumb-plus-img" src={ICON_PLUS} mode="aspectFit" />
              </View>
              <Text className="pet-thumb-name">添加</Text>
            </View>
          </View>
        </View>

        {/* Main menu group */}
        <View className="settings-group">
          {menuItems.map((item, index) => (
            <View
              key={item.label}
              className={`settings-item ${index === 0 ? "first" : ""} ${index === menuItems.length - 1 ? "last" : ""}`}
              onClick={showComingSoon}
            >
              <Image className="item-icon-img" src={item.icon} mode="aspectFit" />
              <Text className="item-label">{item.label}</Text>
              <Image className="item-arrow-img" src={ICON_ARROW_RIGHT} mode="aspectFit" />
            </View>
          ))}
        </View>

        {/* Info group */}
        <View className="settings-group">
          {infoItems.map((item, index) => (
            <View
              key={item.label}
              className={`settings-item ${index === 0 ? "first" : ""} ${index === infoItems.length - 1 ? "last" : ""}`}
              onClick={showComingSoon}
            >
              <Image className="item-icon-img" src={item.icon} mode="aspectFit" />
              <Text className="item-label">{item.label}</Text>
              <Image className="item-arrow-img" src={ICON_ARROW_RIGHT} mode="aspectFit" />
            </View>
          ))}
        </View>

        {/* 采集对照 large button */}
        <View className="collect-data-btn" onClick={handleCollectData}>
          <Text className="collect-data-btn-text">采集对照</Text>
        </View>

        {/* Logout */}
        <View className="logout-btn" onClick={handleLogout}>
          退出登录
        </View>

        {/* TODO: 替换为真实装饰猫插画 (image-import-30.png) */}
        <View className="deco-cat-wrap">
          <Image className="deco-cat-img" src={ICON_CAT} mode="aspectFit" />
        </View>
      </View>
    </View>
  );
}
