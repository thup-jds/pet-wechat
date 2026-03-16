import { View, Text, Image, ScrollView } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { request } from "../../utils/request";
import {
  ICON_CHECK_GREEN,
  ICON_ERROR_RED,
  ICON_SETTINGS,
  ICON_PAW_SMALL,
  ICON_CAT,
} from "../../assets/icons";
import type { Message, MessageType } from "@pet-wechat/shared";
import "./index.scss";

type TabType = "all" | MessageType;

/** 根据消息内容推断变体，决定图标 */
function getMessageVariant(
  msg: Message
): "approved" | "rejected" | "system" | "custom" {
  if (msg.type === "system") {
    // 设计稿: 定制完成消息用猫爪图标
    if (msg.title.includes("定制") || msg.title.includes("图像")) {
      return "custom";
    }
    return "system";
  }
  // TODO: 后端暂无 subType 字段，暂通过 title 关键词判断
  if (msg.title.includes("拒绝") || msg.title.includes("rejected")) {
    return "rejected";
  }
  return "approved";
}

// 设计稿图标映射: 绿勾=授权通过, 红X=拒绝, 齿轮=系统, 猫爪=定制完成
const VARIANT_ICONS = {
  approved: ICON_CHECK_GREEN,
  rejected: ICON_ERROR_RED,
  system: ICON_SETTINGS,
  custom: ICON_PAW_SMALL,
};

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${month}-${day} ${hours}:${minutes}`;
}

export default function Messages() {
  const { top, height } = Taro.getMenuButtonBoundingClientRect();
  const statusBarHeight = Taro.getSystemInfoSync().statusBarHeight ?? 20;
  const navHeight = (top - statusBarHeight) * 2 + height;
  const [tab, setTab] = useState<TabType>("all");
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useDidShow(() => {
    loadMessages();
    loadUnreadCount();
  });

  const loadMessages = async (filterTab?: TabType) => {
    const currentTab = filterTab ?? tab;
    try {
      const params = currentTab === "all" ? "" : `?type=${currentTab}`;
      const list = await request<Message[]>({
        url: `/api/messages${params}`,
      });
      setMessages(list);
    } catch {
      // ignore
    }
  };

  const loadUnreadCount = async () => {
    try {
      const res = await request<{ count: number }>({
        url: "/api/messages/unread-count",
      });
      setUnreadCount(res.count);
    } catch {
      // ignore
    }
  };

  const handleTabChange = (t: TabType) => {
    setTab(t);
    loadMessages(t);
  };

  const handleReadAll = async () => {
    try {
      await request({ url: "/api/messages/read-all", method: "PUT" });
      setUnreadCount(0);
      setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
    } catch {
      // ignore
    }
  };

  const handleRead = async (id: string) => {
    try {
      await request({ url: `/api/messages/${id}/read`, method: "PUT" });
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isRead: true } : m))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const handleDetail = (msg: Message) => {
    if (!msg.isRead) handleRead(msg.id);
    if (msg.type === "authorization") {
      Taro.switchTab({ url: "/pages/devices/index" });
    } else {
      Taro.showModal({
        title: msg.title,
        content: msg.content,
        showCancel: false,
      });
    }
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: "all", label: "全部" },
    { key: "authorization", label: "授权通知" },
    { key: "system", label: "系统消息" },
  ];

  return (
    <View className="messages-page">
      <View className="nav-bar" style={{ paddingTop: `${statusBarHeight}px` }}>
        <View className="nav-bar-content" style={{ height: `${navHeight}px` }}>
          <Text className="nav-title">消息中心</Text>
          <Text
            className={`nav-read-all ${unreadCount > 0 ? "active" : ""}`}
            onClick={() => unreadCount > 0 && handleReadAll()}
          >
            全部已读
          </Text>
        </View>
      </View>

      <View className="tab-bar">
        {tabs.map((t) => (
          <View
            key={t.key}
            className={`tab-item ${tab === t.key ? "active" : ""}`}
            onClick={() => handleTabChange(t.key)}
          >
            <Text className="tab-label">{t.label}</Text>
            <View className="tab-underline" />
          </View>
        ))}
      </View>

      <ScrollView className="message-list" scrollY>
        {messages.length === 0 ? (
          <View className="empty-state">
            <Text className="empty-text">暂无消息</Text>
          </View>
        ) : (
          messages.map((msg) => {
            const variant = getMessageVariant(msg);
            const iconSrc = VARIANT_ICONS[variant];
            return (
              <View
                key={msg.id}
                className={`message-card ${msg.isRead ? "" : "unread"}`}
                onClick={() => {
                  if (!msg.isRead) handleRead(msg.id);
                }}
              >
                <View className="card-body">
                  {/* 设计稿: 消息类型图标 (image-import-20/26/14/48) */}
                  <Image className="msg-icon-img" src={iconSrc} mode="aspectFit" />
                  <View className="msg-content">
                    <View className="msg-top">
                      <Text className="msg-title">{msg.title}</Text>
                      <Text className="msg-time">
                        {formatTime(msg.createdAt)}
                      </Text>
                    </View>
                    <Text className="msg-preview">{msg.content}</Text>
                  </View>
                </View>
                <View
                  className="card-action"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDetail(msg);
                  }}
                >
                  <Text className="action-btn">查看详情</Text>
                </View>
              </View>
            );
          })
        )}

        <View className="bottom-decoration">
          {/* TODO: 替换为真实装饰猫插画 (image-import-30.png 像素猫) */}
          <Image className="cat-deco-img" src={ICON_CAT} mode="aspectFit" />
        </View>
      </ScrollView>
    </View>
  );
}
