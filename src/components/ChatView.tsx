import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { ArrowLeft, Check, CheckCheck, Send } from "lucide-react";
import { AvatarWithInitials } from "@/components/AvatarWithInitials";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Chat, Message } from "@/types";

interface ChatViewProps {
  chat: Chat;
  onSendMessage: (chatId: string, text: string) => void;
  onBack?: () => void;
}

function formatMessageTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MessageStatusIcon({ message }: { message: Message }) {
  if (!message.isOutgoing) return null;
  if (message.status === "sending") {
    return <Check className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />;
  }
  if (message.status === "sent") {
    return <CheckCheck className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />;
  }
  if (message.status === "error") {
    return (
      <span
        id={`msg-error-${message.id}`}
        className="text-[11px] font-medium text-red-600 dark:text-red-400"
      >
        Не отправлено
      </span>
    );
  }
  return null;
}

export function ChatView({ chat, onSendMessage, onBack }: ChatViewProps) {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    bottomRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [chat.messages.length]);

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendMessage(chat.id, trimmed);
    setText("");
  };

  return (
    <div className="flex h-full flex-1 flex-col bg-tg-chat-bg">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-2.5">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            aria-label="Назад"
            className="shrink-0 md:hidden"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Button>
        )}
        <AvatarWithInitials
          name={chat.name}
          color={chat.avatarColor}
          className="h-10 w-10"
        />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold text-foreground">
            {chat.name}
          </h2>
          <p className="truncate text-xs text-muted-foreground">
            {chat.lastSeen ?? chat.chatId}
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {chat.messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="rounded-full bg-black/20 px-4 py-2 text-sm text-white">
              Сообщений пока нет
            </p>
          </div>
        ) : (
          <div className="mx-auto flex max-w-2xl flex-col gap-1.5">
            {chat.messages.map((msg, index) => {
              const prevMsg = index > 0 ? chat.messages[index - 1] : null;
              const showUnreadDivider =
                msg.unread && (!prevMsg || !prevMsg.unread);

              return (
                <div key={msg.id} className="flex flex-col gap-1.5">
                  {showUnreadDivider && (
                    <div className="my-2 flex items-center gap-3">
                      <div className="h-px flex-1 bg-tg-blue/40" />
                      <span className="rounded-full bg-tg-blue/10 px-3 py-0.5 text-xs font-medium text-tg-blue">
                        Непрочитанное
                      </span>
                      <div className="h-px flex-1 bg-tg-blue/40" />
                    </div>
                  )}
                  <div
                    className={`flex ${msg.isOutgoing ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 shadow-sm ${
                        msg.isOutgoing
                          ? "rounded-br-md bg-tg-bubble-outgoing text-foreground dark:text-white"
                          : "rounded-bl-md bg-card text-foreground"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words text-sm">
                        {msg.text}
                      </p>
                      <div className="mt-0.5 flex items-center justify-end gap-1">
                        <MessageStatusIcon message={msg} />
                        <p
                          className={`text-[11px] ${
                            msg.isOutgoing
                              ? "text-foreground/60 dark:text-white/70"
                              : "text-muted-foreground"
                          }`}
                          aria-describedby={
                            msg.status === "error"
                              ? `msg-error-${msg.id}`
                              : undefined
                          }
                        >
                          {formatMessageTime(msg.timestamp)}
                        </p>
                      </div>
                      {msg.status === "error" && msg.error && (
                        <p
                          id={`msg-error-detail-${msg.id}`}
                          className="mt-1 text-[11px] text-red-600 dark:text-red-400"
                        >
                          {msg.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-border bg-card px-4 py-3"
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Написать сообщение..."
          className="flex-1"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!text.trim()}
          className="bg-tg-blue text-white hover:bg-tg-blue-hover"
          aria-label="Отправить"
        >
          <Send className="h-5 w-5" aria-hidden="true" />
        </Button>
      </form>
    </div>
  );
}
