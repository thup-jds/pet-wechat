import { View, Text, Button, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState } from "react";
import { request, setToken } from "../../utils/request";
import { setUserInfo } from "../../utils/storage";
import { ICON_CAT } from "../../assets/icons";
import "./index.scss";

export default function Login() {
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);

  const agreed = agreedTerms && agreedPrivacy;

  const handleWechatLogin = async () => {
    if (!agreed) {
      Taro.showToast({ title: "请先同意所有条款", icon: "none" });
      return;
    }
    setLoading(true);
    try {
      // TODO: 接入真实微信 SDK，当前使用 Taro.login mock
      const { code: wxCode } = await Taro.login();
      const res = await request<{ token: string; user: any }>({
        url: "/api/auth/wechat",
        method: "POST",
        data: { code: wxCode },
        needAuth: false,
      });
      setToken(res.token);
      setUserInfo(res.user);
      Taro.switchTab({ url: "/pages/index/index" });
    } catch (e: any) {
      Taro.showToast({ title: e.message || "登录失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  };

  // TODO: 接入真实手机号快捷登录，当前复用微信登录流程
  const handlePhoneLogin = handleWechatLogin;

  return (
    <View className="login-page">
      <View className="login-top">
        <Text className="brand-name">YEHEY</Text>
        {/* TODO: 替换为真实猫狗插画 (image-import-39.png / boZB4, 995x525) */}
        <View className="illustration-area">
          <Image className="illustration-img" src={ICON_CAT} mode="aspectFit" />
        </View>
        <Text className="welcome-title">欢迎来到宠物新世界</Text>
      </View>

      <View className="login-card">
        <View className="login-buttons">
          <Button
            className="btn-phone"
            loading={loading}
            onClick={handlePhoneLogin}
          >
            本机号码快捷登录
          </Button>
          <Button
            className="btn-wechat"
            loading={loading}
            onClick={handleWechatLogin}
          >
            微信账号登录
          </Button>
        </View>

        {/* 设计稿: 两个独立 checkbox + 条款 */}
        <Text className="agreement-header">本人已阅读并同意以下条款</Text>

        <View className="agreement-row" onClick={() => setAgreedTerms(!agreedTerms)}>
          <View className={`checkbox ${agreedTerms ? "checked" : ""}`} />
          <Text className="agreement-detail">
            我同意《YEHEY平台个人及宠物信息收集声明》中所述与第三方共享信息
          </Text>
        </View>

        <View className="agreement-row" onClick={() => setAgreedPrivacy(!agreedPrivacy)}>
          <View className={`checkbox ${agreedPrivacy ? "checked" : ""}`} />
          <Text className="agreement-detail">
            我已阅读并同意《用户服务协议》和《隐私政策》
          </Text>
        </View>

        <View className="register-link">
          <Text className="register-text">还没有账号？</Text>
          <Text className="register-action">立即注册</Text>
        </View>
      </View>
    </View>
  );
}
