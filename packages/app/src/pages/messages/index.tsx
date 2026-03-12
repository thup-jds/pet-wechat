import { View, Text, ScrollView } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { request } from "../../utils/request";
import type { Message, MessageType } from "@pet-wechat/shared";
import "./index.scss";

type TabType = "all" | MessageType;

/** 根据消息内容推断是通过/拒绝/系统类型，用于图标展示 */
function getMessageVariant(
  msg: Message
): "approved" | "rejected" | "system" {
  if (msg.type === "system") return "system";
  // TODO: 后端暂无 subType 字段，暂通过 title 关键词判断
  if (msg.title.includes("拒绝") || msg.title.includes("rejected")) {
    return "rejected";
  }
  return "approved";
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${month}-${day} ${hours}:${minutes}`;
}

export default function Messages() {
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

  const tabs: { key: TabType; label: string }[] = [
    { key: "all", label: "全部" },
    { key: "authorization", label: "授权通知" },
    { key: "system", label: "系统消息" },
  ];

  const iconMap = {
    approved: { text: "\u2713", className: "icon-approved" },
    rejected: { text: "\u2717", className: "icon-rejected" },
    system: { text: "\u2699", className: "icon-system" },
  };

  return (
    <View className="messages-page">
      <View className="nav-bar">
        <Text className="nav-title">消息中心</Text>
        <Text
          className={`nav-read-all ${unreadCount > 0 ? "active" : ""}`}
          onClick={() => unreadCount > 0 && handleReadAll()}
        >
          全部已读
        </Text>
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
            const icon = iconMap[variant];
            return (
              <View
                key={msg.id}
                className={`message-card ${msg.isRead ? "" : "unread"}`}
                onClick={() => !msg.isRead && handleRead(msg.id)}
              >
                <View className="card-body">
                  <View className={`msg-icon ${icon.className}`}>
                    <Text className="msg-icon-text">{icon.text}</Text>
                  </View>
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
                <View className="card-action">
                  <Text className="action-btn">查看详情</Text>
                </View>
              </View>
            );
          })
        )}

        <View className="bottom-decoration">
          {/* TODO: 替换为实际猫咪装饰图 */}
          <Text className="cat-emoji">🐱</Text>
        </View>
      </ScrollView>
    </View>
  );
}
