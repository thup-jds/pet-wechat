import { useMemo } from "react";
import Taro from "@tarojs/taro";

type SafeAreaInfo = {
  statusBarHeight: number;
  navHeight: number;
  bottomSafeArea: number;
};

const DEFAULT_STATUS_BAR_HEIGHT = 20;
const DEFAULT_NAV_HEIGHT = 44;

export function useSafeArea(): SafeAreaInfo {
  return useMemo(() => {
    const systemInfo = Taro.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight ?? DEFAULT_STATUS_BAR_HEIGHT;
    const safeArea = systemInfo.safeArea;
    const bottomSafeArea = safeArea
      ? Math.max(systemInfo.screenHeight - safeArea.bottom, 0)
      : 0;

    let navHeight = DEFAULT_NAV_HEIGHT;

    try {
      const menuRect = Taro.getMenuButtonBoundingClientRect();
      const verticalGap = Math.max(menuRect.top - statusBarHeight, 0);
      navHeight = Math.max(menuRect.height + verticalGap * 2, DEFAULT_NAV_HEIGHT);
    } catch {
      navHeight = DEFAULT_NAV_HEIGHT;
    }

    return {
      statusBarHeight,
      navHeight,
      bottomSafeArea,
    };
  }, []);
}
