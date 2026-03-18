import Taro from "@tarojs/taro";

export const BASE_URL = "https://pet-wechat.yangl.com.cn";

export function getToken(): string | null {
  return Taro.getStorageSync("token") || null;
}

export function setToken(token: string) {
  Taro.setStorageSync("token", token);
}

export function clearToken() {
  Taro.removeStorageSync("token");
}

interface RequestOptions {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  data?: any;
  needAuth?: boolean;
}

export async function request<T = any>(options: RequestOptions): Promise<T> {
  const { url, method = "GET", data, needAuth = true } = options;
  const header: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (needAuth) {
    const token = getToken();
    if (token) {
      header["Authorization"] = `Bearer ${token}`;
    }
  }

  let res: Taro.request.SuccessCallbackResult;
  try {
    res = await Taro.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header,
    });
  } catch (err: any) {
    throw new Error(`网络异常: ${err.errMsg ?? "无法连接服务器"}`);
  }

  if (res.statusCode === 401) {
    clearToken();
    Taro.redirectTo({ url: "/pages/login/index" });
    throw new Error("登录已过期，请重新登录");
  }

  if (res.statusCode >= 400) {
    const msg = res.data?.error ?? `服务器错误 (${res.statusCode})`;
    throw new Error(msg);
  }

  return res.data as T;
}
