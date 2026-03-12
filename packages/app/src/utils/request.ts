import Taro from "@tarojs/taro";

// TODO: 部署后替换为真实地址
const BASE_URL = "http://localhost:9527";

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

  const res = await Taro.request({
    url: `${BASE_URL}${url}`,
    method,
    data,
    header,
  });

  if (res.statusCode === 401) {
    clearToken();
    Taro.redirectTo({ url: "/pages/login/index" });
    throw new Error("Unauthorized");
  }

  if (res.statusCode >= 400) {
    throw new Error(res.data?.error ?? "请求失败");
  }

  return res.data as T;
}
