// Клиент Green API: отправка сообщений, настройки инстанса, входящие уведомления
import { getCredentials } from "@/lib/credentials";

const API_URL = "https://4100.api.green-api.com";

export interface SendMessageParams {
  chatId: string;
  message: string;
  quotedMessageId?: string;
  typingTime?: number;
  typingType?: string;
}

export interface SendMessageResponse {
  idMessage: string;
}

export interface SetSettingsResponse {
  saveSettings: boolean;
}

export interface ReceiveNotificationResponse {
  receiptId: number;
  body: IncomingNotificationBody;
}

export interface DeleteNotificationResponse {
  result: boolean;
  reason: string;
}

export interface IncomingNotificationBody {
  typeWebhook: string;
  instanceData: {
    idInstance: number;
    wid: string;
    typeInstance: string;
  };
  timestamp: number;
  idMessage: string;
  senderData: {
    chatId: string;
    chatName?: string;
    sender: string;
    senderName?: string;
    senderContactName?: string;
    senderPhoneNumber?: number;
  };
  messageData: {
    typeMessage: string;
    textMessageData?: {
      textMessage: string;
    };
  };
}

export class GreenApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "GreenApiError";
    this.status = status;
  }
}

function requireCredentials(): {
  idInstance: string;
  apiTokenInstance: string;
} {
  const { idInstance, apiTokenInstance } = getCredentials();

  if (!idInstance || !apiTokenInstance) {
    throw new GreenApiError(
      "Не заданы параметры подключения (idInstance / apiTokenInstance)",
    );
  }

  return { idInstance, apiTokenInstance };
}

async function requestJson(url: string, init?: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new GreenApiError(
      "Не удалось подключиться к Green API. Проверьте сеть.",
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const detail =
      body && typeof body === "object" && "message" in body
        ? String((body as { message: unknown }).message)
        : `HTTP ${response.status}`;
    throw new GreenApiError(detail, response.status);
  }

  return body;
}

/**
 * Отправка текстового сообщения через Green API.
 *
 * Запрос: POST {{apiUrl}}/waInstance{{idInstance}}/sendMessage/{{apiTokenInstance}}
 * Тело: { chatId, message, ... }
 * Ответ: { idMessage }
 */
export async function sendMessage(
  params: SendMessageParams,
): Promise<SendMessageResponse> {
  const { idInstance, apiTokenInstance } = requireCredentials();

  const url = `${API_URL}/waInstance${idInstance}/sendMessage/${apiTokenInstance}`;

  const body = await requestJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (
    !body ||
    typeof body !== "object" ||
    !("idMessage" in body) ||
    typeof (body as { idMessage: unknown }).idMessage !== "string"
  ) {
    throw new GreenApiError(
      "Некорректный ответ Green API: отсутствует idMessage",
    );
  }

  return { idMessage: (body as { idMessage: string }).idMessage };
}

/**
 * Обновление настроек инстанса для получения входящих сообщений.
 *
 * Запрос: POST {{apiUrl}}/waInstance{{idInstance}}/setSettings/{{apiTokenInstance}}
 * Тело: { webhookUrl, outgoingWebhook, stateWebhook, incomingWebhook }
 * Ответ: { saveSettings: true }
 */
export async function setSettings(): Promise<SetSettingsResponse> {
  const { idInstance, apiTokenInstance } = requireCredentials();

  const url = `${API_URL}/waInstance${idInstance}/setSettings/${apiTokenInstance}`;

  const body = await requestJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      webhookUrl: "",
      incomingWebhook: "yes",
    }),
  });

  if (
    !body ||
    typeof body !== "object" ||
    !("saveSettings" in body) ||
    (body as { saveSettings: unknown }).saveSettings !== true
  ) {
    throw new GreenApiError(
      "Некорректный ответ Green API: отсутствует saveSettings",
    );
  }

  return { saveSettings: true };
}

/**
 * Получение входящего уведомления из очереди Green API (long polling).
 *
 * Запрос: GET {{apiUrl}}/waInstance{{idInstance}}/receiveNotification/{{apiTokenInstance}}?receiveTimeout={{seconds}}
 * seconds — таймаут ожидания уведомления, от 5 до 60 секунд (по умолчанию 5).
 * Ответ: { receiptId, body }
 */
export async function receiveNotification(
  seconds = 5,
): Promise<ReceiveNotificationResponse | null> {
  const { idInstance, apiTokenInstance } = requireCredentials();

  const timeout = Math.min(60, Math.max(5, seconds));
  const url = `${API_URL}/waInstance${idInstance}/receiveNotification/${apiTokenInstance}?receiveTimeout=${timeout}`;

  const body = await requestJson(url, { method: "GET" });

  // null означает, что очередь уведомлений пуста
  if (body === null || body === undefined) {
    return null;
  }

  if (
    typeof body !== "object" ||
    !("receiptId" in body) ||
    typeof (body as { receiptId: unknown }).receiptId !== "number" ||
    !("body" in body) ||
    typeof (body as { body: unknown }).body !== "object"
  ) {
    throw new GreenApiError(
      "Некорректный ответ Green API: отсутствует receiptId или body",
    );
  }

  return body as ReceiveNotificationResponse;
}

/**
 * Удаление входящего уведомления из очереди Green API.
 *
 * Запрос: POST {{apiUrl}}/waInstance{{idInstance}}/deleteNotification/{{apiTokenInstance}}/{{receiptId}}
 * Ответ: { result: boolean, reason: string }
 */
export async function deleteNotification(
  receiptId: number,
): Promise<DeleteNotificationResponse> {
  const { idInstance, apiTokenInstance } = requireCredentials();

  const url = `${API_URL}/waInstance${idInstance}/deleteNotification/${apiTokenInstance}/${receiptId}`;

  const body = await requestJson(url, { method: "DELETE" });

  if (
    !body ||
    typeof body !== "object" ||
    !("result" in body) ||
    typeof (body as { result: unknown }).result !== "boolean"
  ) {
    throw new GreenApiError("Некорректный ответ Green API: отсутствует result");
  }

  const result = (body as { result: boolean }).result;
  const reason = (body as { reason?: unknown }).reason;

  return {
    result,
    reason: typeof reason === "string" ? reason : "",
  };
}
