import { View, Text } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { clearToken, request } from "../../utils/request";
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
    clearToken();
    Taro.removeStorageSync("userInfo");
    Taro.showToast({ title: "已退出登录", icon: "success" });
    setTimeout(() => {
      Taro.reLaunch({ url: "/pages/login/index" });
    }, 1000);
  };

  // TODO: 待各设置页面实现后添加 onClick 导航
  const menuItems = [
    { label: "通知设置" },
    { label: "隐私设置" },
    { label: "主题设置" },
    { label: "语言选择" },
  ];

  const infoItems = [
    { label: "关于我们" },
    { label: "帮助与反馈" },
    { label: "隐私政策" },
  ];

  return (
    <View className="settings-page">
      <View className="nav-bar">
        <Text className="nav-title">设置</Text>
      </View>

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
                <Text className="pet-thumb-plus">+</Text>
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
            >
              <Text className="item-label">{item.label}</Text>
              <Text className="item-arrow">›</Text>
            </View>
          ))}
        </View>

        {/* Info group */}
        <View className="settings-group">
          {infoItems.map((item, index) => (
            <View
              key={item.label}
              className={`settings-item ${index === 0 ? "first" : ""} ${index === infoItems.length - 1 ? "last" : ""}`}
            >
              <Text className="item-label">{item.label}</Text>
              <Text className="item-arrow">›</Text>
            </View>
          ))}
        </View>

        {/* Collection reference section */}
        <View className="settings-group">
          <View className="settings-item first last">
            <Text className="item-label">采集对照</Text>
            <Text className="item-arrow">›</Text>
          </View>
        </View>

        {/* Logout */}
        <View className="logout-btn" onClick={handleLogout}>
          退出登录
        </View>

        {/* Decorative cat */}
        <View className="deco-cat-wrap">
          <Text className="deco-cat-emoji">🐱</Text>
        </View>
      </View>
    </View>
  );
}
