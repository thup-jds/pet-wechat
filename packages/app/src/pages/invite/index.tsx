import { View, Text } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { useState, useEffect } from "react";
import { request } from "../../utils/request";
import { isLoggedIn } from "../../utils/storage";
import "./index.scss";

interface InviteInfo {
  petName: string;
  petSpecies: string;
  fromNickname: string;
  fromUserId: string;
  petId: string;
}

export default function Invite() {
  const router = useRouter();
  const code = router.params.code;

  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!code) return;
    request<InviteInfo>({ url: `/api/devices/invite/${code}`, needAuth: false })
      .then(setInfo)
      .catch(() => setError("邀请链接无效或已过期"));
  }, [code]);

  const handleAccept = async () => {
    if (!code) return;
    if (!isLoggedIn()) {
      Taro.showToast({ title: "请先登录", icon: "none" });
      Taro.redirectTo({ url: `/pages/login/index?redirect=/pages/invite/index?code=${code}` });
      return;
    }
    setLoading(true);
    try {
      await request({
        url: `/api/devices/invite/${code}/accept`,
        method: "POST",
      });
      setDone(true);
    } catch (e: any) {
      if (e.message?.includes("Already")) {
        setError("您已接受过此邀请");
      } else if (e.message?.includes("own")) {
        setError("不能接受自己的邀请");
      } else {
        setError(e.message || "接受邀请失败");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoHome = () => {
    Taro.switchTab({ url: "/pages/index/index" });
  };

  if (error) {
    return (
      <View className="invite-page">
        <View className="invite-card">
          <Text className="invite-icon">❌</Text>
          <Text className="invite-error">{error}</Text>
          <View className="btn-primary" onClick={handleGoHome}>
            <Text className="btn-text">返回首页</Text>
          </View>
        </View>
      </View>
    );
  }

  if (done) {
    return (
      <View className="invite-page">
        <View className="invite-card">
          <Text className="invite-icon">✅</Text>
          <Text className="invite-title">授权成功！</Text>
          <Text className="invite-desc">
            您已成功获得查看【{info?.petName}】的授权
          </Text>
          <View className="btn-primary" onClick={handleGoHome}>
            <Text className="btn-text">进入主页查看</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="invite-page">
      <View className="invite-card">
        <Text className="invite-icon">
          {info?.petSpecies === "dog" ? "🐶" : "🐱"}
        </Text>
        <Text className="invite-title">宠物授权邀请</Text>
        <Text className="invite-desc">
          {info?.fromNickname ?? "某用户"} 邀请您查看TA的宠物
        </Text>
        <View className="pet-name-tag">
          <Text className="pet-name-text">{info?.petName ?? "加载中..."}</Text>
        </View>
        <Text className="invite-hint">
          接受后您可以在主页查看该宠物的实时状态
        </Text>
        <View
          className={`btn-primary ${loading ? "disabled" : ""}`}
          onClick={handleAccept}
        >
          <Text className="btn-text">
            {loading ? "处理中..." : "接受邀请"}
          </Text>
        </View>
        <Text className="skip-link" onClick={handleGoHome}>
          暂不接受
        </Text>
      </View>
    </View>
  );
}
