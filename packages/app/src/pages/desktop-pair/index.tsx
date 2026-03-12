import { View, Text, ScrollView } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState, useEffect } from "react";
import { request } from "../../utils/request";
import type { Pet, DesktopDevice } from "@pet-wechat/shared";
import "./index.scss";

export default function DesktopPair() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [desktops, setDesktops] = useState<DesktopDevice[]>([]);
  const [selectedPet, setSelectedPet] = useState("");
  const [selectedDesktop, setSelectedDesktop] = useState("");

  useEffect(() => {
    request<{ pets: Pet[] }>({ url: "/api/pets" }).then((r) => setPets(r.pets));
    request<{ desktops: DesktopDevice[] }>({ url: "/api/devices/desktops" }).then(
      (r) => setDesktops(r.desktops)
    );
  }, []);

  const handlePair = async () => {
    if (!selectedPet || !selectedDesktop) {
      Taro.showToast({ title: "请选择宠物和桌面端", icon: "none" });
      return;
    }
    try {
      await request({
        url: `/api/devices/desktops/${selectedDesktop}/bind`,
        method: "POST",
        data: { petId: selectedPet, bindingType: "owner" },
      });
      Taro.showToast({ title: "配对成功", icon: "success" });
      setTimeout(() => {
        Taro.switchTab({ url: "/pages/index/index" });
      }, 1000);
    } catch (e: any) {
      Taro.showToast({ title: e.message || "配对失败", icon: "none" });
    }
  };

  return (
    <View className="desktop-pair-page container">
      <Text className="page-title">项圈配对桌面端</Text>

      <Text className="section-title">选择宠物</Text>
      <ScrollView className="list-section" scrollY>
        {pets.length === 0 ? (
          <Text className="empty-text">暂无宠物，请先添加</Text>
        ) : (
          pets.map((pet) => (
            <View
              key={pet.id}
              className={`list-item card ${selectedPet === pet.id ? "selected" : ""}`}
              onClick={() => setSelectedPet(pet.id)}
            >
              <Text className="item-name">
                {pet.species === "cat" ? "🐱" : "🐶"} {pet.name}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      <Text className="section-title">选择桌面端</Text>
      <ScrollView className="list-section" scrollY>
        {desktops.length === 0 ? (
          <Text className="empty-text">暂无桌面端设备</Text>
        ) : (
          desktops.map((d) => (
            <View
              key={d.id}
              className={`list-item card ${selectedDesktop === d.id ? "selected" : ""}`}
              onClick={() => setSelectedDesktop(d.id)}
            >
              <Text className="item-name">🖥️ {d.name}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <View className="btn-primary" onClick={handlePair}>
        一键连接
      </View>
    </View>
  );
}
