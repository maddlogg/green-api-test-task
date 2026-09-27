import { AvatarWithInitials } from "@/components/AvatarWithInitials";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Chat } from "@/types";

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

export function Sidebar({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
}: SidebarProps) {
  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-sidebar md:w-[320px] md:shrink-0">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <h2 className="text-lg font-semibold text-sidebar-foreground">Чаты</h2>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button
            size="sm"
            onClick={onNewChat}
            className="bg-tg-blue text-white hover:bg-tg-blue-hover"
          >
            Новый чат
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Нет чатов
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={onNewChat}
              className="text-tg-blue hover:bg-tg-blue/10 hover:text-tg-blue"
            >
              Создать первый чат
            </Button>
          </div>
        )}
        <ul className="flex flex-col">
          {chats.map((chat) => {
            const lastMessage = chat.messages[chat.messages.length - 1];
            const isActive = chat.id === activeChatId;
            const hasUnread = chat.unreadCount > 0;
            return (
              <li key={chat.id}>
                <button
                  type="button"
                  onClick={() => onSelectChat(chat.id)}
                  className={`flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    isActive
                      ? "bg-tg-blue text-white"
                      : "hover:bg-accent text-sidebar-foreground"
                  }`}
                >
                  <AvatarWithInitials
                    name={chat.name}
                    color={chat.avatarColor}
                    className="h-12 w-12 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className={`truncate font-medium ${
                          hasUnread && !isActive ? "font-semibold" : ""
                        }`}
                      >
                        {chat.name}
                      </span>
                      {lastMessage && (
                        <span
                          className={`shrink-0 text-xs ${
                            isActive ? "text-white/80" : "text-muted-foreground"
                          }`}
                        >
                          {formatTime(lastMessage.timestamp)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`truncate text-sm ${
                          isActive ? "text-white/80" : "text-muted-foreground"
                        }`}
                      >
                        {lastMessage
                          ? `${lastMessage.isOutgoing ? "Вы: " : ""}${lastMessage.text}`
                          : "Нет сообщений"}
                      </span>
                      {hasUnread && (
                        <span
                          aria-label={`${chat.unreadCount} непрочитанных`}
                          className={`flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                            isActive
                              ? "bg-white text-tg-blue"
                              : "bg-tg-blue text-white"
                          }`}
                        >
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
