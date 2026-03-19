import Taro from "@tarojs/taro";

const STORAGE_KEY = "__ui_polish_mode__";
export const MOCK_TOKEN = "mock-token";

export function isMockMode(): boolean {
  return Taro.getStorageSync(STORAGE_KEY) === "1";
}

export function setMockMode(enabled: boolean): void {
  if (enabled) {
    Taro.setStorageSync(STORAGE_KEY, "1");
    ensureMockLoginState();
    return;
  }

  Taro.removeStorageSync(STORAGE_KEY);

  if (Taro.getStorageSync("token") === MOCK_TOKEN) {
    Taro.removeStorageSync("token");
  }
}

export function ensureMockLoginState(): void {
  if (!isMockMode()) {
    return;
  }

  if (!Taro.getStorageSync("token")) {
    Taro.setStorageSync("token", MOCK_TOKEN);
  }
}
