import { useCallback, useEffect, useRef, useState } from "react";
import { AuthScreen } from "@/components/AuthScreen";
import { ChatView } from "@/components/ChatView";
import { CreateChatDialog } from "@/components/CreateChatDialog";
import { Sidebar } from "@/components/Sidebar";
import {
  deleteNotification,
  receiveNotification,
  sendMessage,
  setSettings,
} from "@/lib/greenApi";
import { setCredentials } from "@/lib/credentials";
import { applyTheme, getInitialTheme } from "@/lib/theme";
import type { Chat, Message } from "@/types";

const AVATAR_COLORS = [
  "#e17076",
  "#7bc862",
  "#5eb5f6",
  "#a695e7",
  "#f4b860",
  "#6ec9cb",
];

/**
 * Нормализует номер телефона в формат Green API: "79876543210@c.us".
 * Убирает все нецифровые символы, приводит к международному формату.
 */
function toGreenApiChatId(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("8")) {
    digits = `7${digits.slice(1)}`;
  }
  return `${digits}@c.us`;
}

/**
 * Формирует chatId для Green API из входящего уведомления.
 * Для Messenger — chatId из senderData, для WhatsApp — номер телефона.
 */
function toIncomingChatId(
  typeInstance: string,
  senderData: { chatId: string; senderPhoneNumber?: number },
): string {
  if (typeInstance === "telegram") {
    return senderData.chatId;
  }
  if (senderData.senderPhoneNumber) {
    return `${senderData.senderPhoneNumber}@c.us`;
  }
  return senderData.chatId;
}

/**
 * Извлекает текст из входящего уведомления.
 * Возвращает null, если сообщение не текстовое (фото, документ и т.д.).
 */
function extractIncomingText(messageData: {
  typeMessage: string;
  textMessageData?: { textMessage: string };
}): string | null {
  if (
    messageData.typeMessage === "textMessage" &&
    messageData.textMessageData
  ) {
    return messageData.textMessageData.textMessage;
  }
  return null;
}

function App() {
  const [authed, setAuthed] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const activeChatIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  const handleAuth = useCallback((id: string, token: string) => {
    setCredentials(id, token);
    setAuthed(true);
  }, []);

  // При входе в приложение обновляем настройки инстанса для получения входящих сообщений
  useEffect(() => {
    if (!authed) return;
    setSettings().catch((err) => {
      console.error("Не удалось обновить настройки инстанса:", err);
    });
  }, [authed]);

  // Цикл long polling для получения входящих уведомлений
  useEffect(() => {
    if (!authed) return;

    let cancelled = false;

    const poll = async () => {
      while (!cancelled) {
        try {
          const notification = await receiveNotification(30);

          if (cancelled) break;

          // null — очередь пуста, просто продолжаем цикл
          if (notification === null) continue;

          const { receiptId, body } = notification;

          // Обработка входящего уведомления
          if (body.typeWebhook === "incomingMessageReceived") {
            const {
              instanceData,
              senderData,
              messageData,
              idMessage,
              timestamp,
            } = body;
            const greenApiChatId = toIncomingChatId(
              instanceData.typeInstance,
              senderData,
            );
            const text = extractIncomingText(messageData);

            if (text !== null) {
              const message: Message = {
                id: idMessage,
                text,
                timestamp: timestamp * 1000,
                isOutgoing: false,
                unread: false,
              };

              setChats((prev) => {
                // Ищем чат по chatId или по номеру телефона из senderData
                const existing = prev.find(
                  (c) =>
                    c.chatId === greenApiChatId ||
                    (senderData.senderPhoneNumber !== undefined &&
                      c.chatId === `${senderData.senderPhoneNumber}@c.us`),
                );
                // Чат не найден — игнорируем, автосоздание отключено
                if (!existing) return prev;
                // Непрочитанным считается только то, что пришло, когда чат закрыт
                const isActive = activeChatIdRef.current === existing.id;
                return prev.map((c) =>
                  c.id === existing.id
                    ? {
                        ...c,
                        messages: [...c.messages, message],
                        unreadCount: isActive
                          ? c.unreadCount
                          : c.unreadCount + 1,
                      }
                    : c,
                );
              });
            }
          }
          await deleteNotification(receiptId);
        } catch (err) {
          if (cancelled) break;
          console.error("Ошибка получения уведомления:", err);
          // Пауза перед повтором при ошибке
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
    };

    poll();

    return () => {
      cancelled = true;
    };
  }, [authed]);

  const handleSendMessage = useCallback(
    async (chatId: string, text: string) => {
      const tempId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const message: Message = {
        id: tempId,
        text,
        timestamp: Date.now(),
        isOutgoing: true,
        status: "sending",
      };
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId ? { ...c, messages: [...c.messages, message] } : c,
        ),
      );

      const chat = chats.find((c) => c.id === chatId);
      if (!chat) return;

      try {
        const result = await sendMessage({
          chatId: chat.chatId,
          message: text,
        });
        setChats((prev) =>
          prev.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === tempId
                      ? { ...m, id: result.idMessage, status: "sent" }
                      : m,
                  ),
                }
              : c,
          ),
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Не удалось отправить сообщение";
        setChats((prev) =>
          prev.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === tempId
                      ? { ...m, status: "error", error: errorMessage }
                      : m,
                  ),
                }
              : c,
          ),
        );
      }
    },
    [chats],
  );

  const handleCreateChat = useCallback((phone: string) => {
    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      name: phone,
      chatId: toGreenApiChatId(phone),
      avatarColor:
        AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      messages: [],
      unreadCount: 0,
    };
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  }, []);

  // Пометить все входящие сообщения в чате как прочитанные
  const handleSelectChat = useCallback((id: string) => {
    setActiveChatId(id);
    setChats((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              unreadCount: 0,
              messages: c.messages.map((m) =>
                m.unread ? { ...m, unread: false } : m,
              ),
            }
          : c,
      ),
    );
  }, []);

  if (!authed) {
    return <AuthScreen onAuth={handleAuth} />;
  }

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={() => setCreateDialogOpen(true)}
      />
      <main
        aria-label="Область чата"
        className="hidden min-w-0 flex-1 flex-col md:flex"
      >
        {activeChat ? (
          <ChatView chat={activeChat} onSendMessage={handleSendMessage} />
        ) : (
          <div className="flex h-full items-center justify-center bg-tg-chat-bg">
            <p className="rounded-full bg-black/20 px-4 py-2 text-sm text-white">
              {chats.length === 0
                ? "Создайте чат, чтобы начать общение"
                : "Выберите чат, чтобы начать общение"}
            </p>
          </div>
        )}
      </main>
      {activeChat && (
        <div className="fixed inset-0 z-40 flex flex-col md:hidden">
          <ChatView
            chat={activeChat}
            onSendMessage={handleSendMessage}
            onBack={() => setActiveChatId(null)}
          />
        </div>
      )}
      <CreateChatDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={handleCreateChat}
      />
    </div>
  );
}

// Применяем тему до первого рендера
applyTheme(getInitialTheme());

export default App;
