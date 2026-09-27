// Глобальные переменные для параметров подключения
let idInstance: string | null = null;
let apiTokenInstance: string | null = null;

export function setCredentials(id: string, token: string) {
  idInstance = id;
  apiTokenInstance = token;
}

export function getCredentials() {
  return { idInstance, apiTokenInstance };
}
