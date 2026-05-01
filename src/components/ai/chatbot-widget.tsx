"use client";

import { Bot, Loader2, MessageCircle, Send, X } from "lucide-react";
import { useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAiChatMutation } from "@/features/ai";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  actions?: Array<{ label: string; href: string }>;
};

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const initialMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Ask about EcoSpark ideas, recommendations, coupons, dashboards, or how to submit a better idea.",
};

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const chatMutation = useAiChatMutation();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const canSubmit = inputValue.trim().length > 0 && !chatMutation.isPending;

  const panelTitle = useMemo(
    () => (chatMutation.isPending ? "EcoSpark AI is replying" : "EcoSpark AI assistant"),
    [chatMutation.isPending],
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const message = inputValue.trim();

    if (!message || chatMutation.isPending) {
      return;
    }

    setInputValue("");
    setMessages((previous) => [
      ...previous,
      { id: createMessageId(), role: "user", content: message },
    ]);

    try {
      const response = await chatMutation.mutateAsync({ message });
      setMessages((previous) => [
        ...previous,
        {
          id: createMessageId(),
          role: "assistant",
          content: response.data.reply,
          actions: response.data.suggestedActions,
        },
      ]);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          id: createMessageId(),
          role: "assistant",
          content: getApiErrorMessage(error),
        },
      ]);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <section className="mb-3 grid h-[min(34rem,calc(100vh-6rem))] w-[min(24rem,calc(100vw-2rem))] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-lg border border-border bg-background shadow-xl">
          <header className="flex items-center justify-between gap-3 border-b border-border p-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground">
                <Bot className="size-4" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold">{panelTitle}</h2>
                <p className="truncate text-xs text-muted-foreground">
                  Product support and idea guidance
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Close AI chat"
              onClick={() => setIsOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </header>

          <div className="grid content-start gap-3 overflow-y-auto p-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "max-w-[88%] rounded-lg px-3 py-2 text-sm leading-6",
                  message.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "mr-auto border border-border bg-muted text-foreground",
                )}
              >
                <p>{message.content}</p>
                {message.actions && message.actions.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {message.actions.map((action) => (
                      <Link
                        key={`${action.label}-${action.href}`}
                        href={action.href}
                        className="rounded-md bg-background px-2 py-1 text-xs font-medium text-foreground"
                        onClick={() => setIsOpen(false)}
                      >
                        {action.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {chatMutation.isPending ? (
              <div className="mr-auto inline-flex max-w-[88%] items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Thinking
              </div>
            ) : null}
          </div>

          <form className="flex gap-2 border-t border-border p-3" onSubmit={onSubmit}>
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Ask the AI assistant"
              maxLength={1500}
              className="h-10"
            />
            <Button
              type="submit"
              size="icon-lg"
              aria-label="Send message"
              disabled={!canSubmit}
            >
              {chatMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </form>
        </section>
      ) : null}

      <Button
        type="button"
        size="icon-lg"
        aria-label={isOpen ? "Close AI chat" : "Open AI chat"}
        className="size-12 rounded-full shadow-lg"
        onClick={() => {
          setIsOpen((previous) => !previous);
          window.setTimeout(() => inputRef.current?.focus(), 50);
        }}
      >
        {isOpen ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </Button>
    </div>
  );
}
