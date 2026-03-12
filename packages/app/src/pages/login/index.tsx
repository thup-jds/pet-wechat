import { View, Text, Button } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState } from "react";
import { request, setToken } from "../../utils/request";
import { setUserInfo } from "../../utils/storage";
import "./index.scss";

export default function Login() {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleWechatLogin = async () => {
    if (!agreed) {
      Taro.showToast({ title: "请先同意用户协议", icon: "none" });
      return;
    }
    setLoading(true);
    try {
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
        {/* TODO: 替换为猫狗插画图片 */}
        <View className="illustration-placeholder">
          <Text className="illustration-text">🐱 🐶</Text>
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

        <View className="agreement" onClick={() => setAgreed(!agreed)}>
          <View className={`checkbox ${agreed ? "checked" : ""}`} />
          <Text className="agreement-text">
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
