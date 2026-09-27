import { useState, type SubmitEvent } from "react";
import { Eye, EyeOff, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AuthScreenProps {
  onAuth: (idInstance: string, apiTokenInstance: string) => void;
}

export function AuthScreen({ onAuth }: AuthScreenProps) {
  const [idInstance, setIdInstance] = useState("");
  const [apiTokenInstance, setApiTokenInstance] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    if (!idInstance.trim() || !apiTokenInstance.trim()) {
      setError("Оба поля обязательны для заполнения");
      return;
    }
    onAuth(idInstance.trim(), apiTokenInstance.trim());
  };

  const idInstanceInvalid = error !== "" && !idInstance.trim();
  const tokenInvalid = error !== "" && !apiTokenInstance.trim();

  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-tg-blue">
            <Send className="h-7 w-7 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            Messenger Web
          </h1>
          <p className="text-sm text-muted-foreground">
            Введите параметры для подключения
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="idInstance"
              className="text-sm font-medium text-foreground"
            >
              ID Instance
            </label>
            <Input
              id="idInstance"
              value={idInstance}
              onChange={(e) => {
                setIdInstance(e.target.value);
                setError("");
              }}
              placeholder="Введите ID инстанса"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              aria-invalid={idInstanceInvalid || undefined}
              aria-describedby={idInstanceInvalid ? "auth-error" : undefined}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="apiTokenInstance"
              className="text-sm font-medium text-foreground"
            >
              API Token Instance
            </label>
            <div className="relative">
              <Input
                id="apiTokenInstance"
                type={showToken ? "text" : "password"}
                value={apiTokenInstance}
                onChange={(e) => {
                  setApiTokenInstance(e.target.value);
                  setError("");
                }}
                placeholder="Введите API токен"
                autoComplete="new-password"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                className="pr-10"
                aria-invalid={tokenInvalid || undefined}
                aria-describedby={tokenInvalid ? "auth-error" : undefined}
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showToken ? "Скрыть токен" : "Показать токен"}
              >
                {showToken ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p id="auth-error" role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full">
            Войти
          </Button>
        </form>
      </div>
    </div>
  );
}
