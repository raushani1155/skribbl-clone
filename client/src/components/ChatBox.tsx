import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ChatMessage } from "../types";

interface Props {
  messages: ChatMessage[];
  placeholder: string;
  onSend: (text: string) => void;
}

export function ChatBox({ messages, placeholder, onSend }: Props) {
  const [text, setText] = useState("");
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <div className="chat">
      <ul className="chat__list" ref={listRef}>
        {messages.map((m) => (
          <li key={m.id} className={`chat__msg chat__msg--${m.kind}`}>
            {m.name && <b>{m.name}: </b>}
            {m.text}
          </li>
        ))}
      </ul>
      <form className="chat__form" onSubmit={submit}>
        <input
          className="input"
          value={text}
          maxLength={100}
          placeholder={placeholder}
          onChange={(e) => setText(e.target.value)}
        />
      </form>
    </div>
  );
}