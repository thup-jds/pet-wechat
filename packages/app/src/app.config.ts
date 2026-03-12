export default defineAppConfig({
  pages: [
    "pages/index/index",
    "pages/login/index",
    "pages/guide/index",
    "pages/collar-bind/index",
    "pages/wifi-config/index",
    "pages/pet-info/index",
    "pages/pet-avatar/index",
    "pages/avatar-progress/index",
    "pages/desktop-bind/index",
    "pages/desktop-pair/index",
    "pages/devices/index",
    "pages/messages/index",
    "pages/profile/index",
    "pages/settings/index",
  ],
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#fff",
    navigationBarTitleText: "YEHEY",
    navigationBarTextStyle: "black",
    navigationStyle: "custom",
  },
  tabBar: {
    color: "#999999",
    selectedColor: "#333333",
    backgroundColor: "#ffffff",
    borderStyle: "white",
    list: [
      {
        pagePath: "pages/index/index",
        text: "主页",
      },
      {
        pagePath: "pages/devices/index",
        text: "设备",
      },
      {
        pagePath: "pages/messages/index",
        text: "消息",
      },
      {
        pagePath: "pages/profile/index",
        text: "我的",
      },
    ],
  },
});
