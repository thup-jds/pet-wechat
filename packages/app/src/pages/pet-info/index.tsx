import { View, Text, Input, Picker } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useState, useEffect } from "react";
import { request } from "../../utils/request";
import type { Pet, Species, Gender } from "@pet-wechat/shared";
import "./index.scss";

const genderOptions = ["公", "母", "未知"];
const genderMap: Record<string, Gender> = {
  公: "male",
  母: "female",
  未知: "unknown",
};
const genderReverseMap: Record<Gender, string> = {
  male: "公",
  female: "母",
  unknown: "未知",
};

export default function PetInfo() {
  const router = useRouter();
  const petId = router.params.id;
  const collarId = router.params.collarId;

  const [name, setName] = useState("");
  const [species, setSpecies] = useState<Species>("cat");
  const [breed, setBreed] = useState("");
  const [gender, setGender] = useState<Gender>("unknown");
  const [birthday, setBirthday] = useState("");
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (petId) {
      request<{ pet: Pet }>({ url: `/api/pets/${petId}` }).then(
        ({ pet }) => {
          setName(pet.name);
          setSpecies(pet.species);
          if (pet.breed) setBreed(pet.breed);
          setGender(pet.gender);
          if (pet.birthday) setBirthday(pet.birthday);
          if (pet.weight) setWeight(String(pet.weight));
        }
      );
    }
  }, [petId]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Taro.showToast({ title: "请输入宠物名字", icon: "none" });
      return;
    }
    setLoading(true);
    try {
      const data = {
        name: name.trim(),
        species,
        breed: breed || null,
        gender,
        birthday: birthday || null,
        weight: weight ? Number(weight) : null,
      };

      if (petId) {
        await request({ url: `/api/pets/${petId}`, method: "PUT", data });
        Taro.showToast({ title: "更新成功", icon: "success" });
      } else {
        const { pet } = await request<{ pet: Pet }>({
          url: "/api/pets",
          method: "POST",
          data,
        });

        // 如果从项圈绑定流程进来，关联项圈和宠物
        if (collarId) {
          await request({
            url: `/api/devices/collars/${collarId}`,
            method: "PUT",
            data: { petId: pet.id },
          });
        }

        Taro.showToast({ title: "添加成功", icon: "success" });
        setTimeout(() => {
          Taro.navigateTo({
            url: `/pages/pet-avatar/index?petId=${pet.id}`,
          });
        }, 1000);
      }
    } catch (e: any) {
      Taro.showToast({ title: e.message || "操作失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="pet-info-page">
      <Text className="brand-title">YEHEY</Text>

      {/* TODO: 替换为半透明猫狗背景插画 */}
      <View className="bg-illustration">
        <Text className="bg-illustration-emoji">🐾</Text>
      </View>

      <View className="main-card">
        <Text className="card-title">录入宠物信息</Text>

        <View className="species-selector">
          <View
            className={`species-option ${species === "cat" ? "active" : ""}`}
            onClick={() => setSpecies("cat")}
          >
            {/* TODO: 替换为可爱猫咪图标 */}
            <Text className="species-icon">🐱</Text>
            <Text className="species-label">猫咪</Text>
          </View>
          <Text className="species-or">or</Text>
          <View
            className={`species-option ${species === "dog" ? "active" : ""}`}
            onClick={() => setSpecies("dog")}
          >
            {/* TODO: 替换为可爱狗狗图标 */}
            <Text className="species-icon">🐶</Text>
            <Text className="species-label">狗狗</Text>
          </View>
        </View>

        <View className="form-section">
          <View className="form-item underline">
            <Text className="label">宠物名字</Text>
            <Input
              className="input-field"
              placeholder="给宠物起个名字"
              value={name}
              onInput={(e) => setName(e.detail.value)}
            />
          </View>

          <View className="form-item underline">
            <Text className="label">宠物品种</Text>
            <Input
              className="input-field"
              placeholder={species === "cat" ? "如：布偶猫" : "如：金毛"}
              value={breed}
              onInput={(e) => setBreed(e.detail.value)}
            />
          </View>

          <View className="form-item underline">
            <Text className="label">公/母</Text>
            <View className="gender-selector">
              {genderOptions.slice(0, 2).map((g) => (
                <View
                  key={g}
                  className={`gender-btn ${gender === genderMap[g] ? "active" : ""}`}
                  onClick={() => setGender(genderMap[g])}
                >
                  <Text className="gender-btn-text">{g}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className="form-item underline">
            <Text className="label">出生日期</Text>
            <Picker
              mode="date"
              value={birthday}
              onChange={(e) => setBirthday(e.detail.value)}
            >
              <View className="input-field picker-field">
                <Text className={birthday ? "" : "placeholder"}>
                  {birthday || "选择日期"}
                </Text>
              </View>
            </Picker>
          </View>

          <View className="form-item underline">
            <Text className="label">体重(kg)</Text>
            <Input
              className="input-field"
              type="digit"
              placeholder="如：5.5"
              value={weight}
              onInput={(e) => setWeight(e.detail.value)}
            />
          </View>
        </View>

        {collarId && (
          <View className="collar-info">
            <Text className="collar-info-label">当前关联设备</Text>
            <Text className="collar-info-id">Collar ID: {collarId}</Text>
          </View>
        )}

        <View className="btn-primary submit-btn" onClick={handleSubmit}>
          {loading ? "保存中..." : "保存，下一步"}
        </View>
      </View>
    </View>
  );
}
