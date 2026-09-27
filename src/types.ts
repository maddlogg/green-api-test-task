export type MessageStatus = "sending" | "sent" | "error";

export interface Message {
  id: string;
  text: string;
  timestamp: number;
  isOutgoing: boolean;
  status?: MessageStatus;
  error?: string;
  /** true, если входящее сообщение ещё не прочитано пользователем */
  unread?: boolean;
}

export interface Chat {
  id: string;
  name: string;
  /** chatId для Green API: номер телефона в формате "79876543210@c.us" */
  chatId: string;
  avatarColor: string;
  lastSeen?: string;
  messages: Message[];
  /** Количество непрочитанных входящих сообщений */
  unreadCount: number;
}
