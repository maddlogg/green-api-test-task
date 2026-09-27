import { useState, type SubmitEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CreateChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (phone: string) => void;
}

const PHONE_REGEX = /^\+?[\d\s()-]{7,20}$/;

export function CreateChatDialog({
  open,
  onOpenChange,
  onCreate,
}: CreateChatDialogProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Введите номер телефона");
      return;
    }
    if (!PHONE_REGEX.test(trimmed)) {
      setError("Введите корректный номер телефона, например +7 900 000-00-00");
      return;
    }
    onCreate(trimmed);
    setValue("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setValue("");
          setError("");
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Новый чат</DialogTitle>
          <DialogDescription>
            Введите номер телефона получателя
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="new-chat-phone"
              className="text-sm font-medium text-foreground"
            >
              Номер телефона
            </label>
            <Input
              id="new-chat-phone"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError("");
              }}
              placeholder="+7 900 000-00-00"
              inputMode="tel"
              autoFocus
              aria-invalid={error !== "" || undefined}
              aria-describedby={error !== "" ? "create-chat-error" : undefined}
            />
          </div>
          {error && (
            <p
              id="create-chat-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button type="submit">Создать</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
