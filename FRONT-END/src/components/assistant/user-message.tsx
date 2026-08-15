import type { Message } from "./assistant-types";
export function UserMessage({ message }: { message: Message }) {
  return (
    <article className="message user" id={`message-${message.id}`}>
      <div className="message-body">
        <strong>You</strong>
        <p>{message.text}</p>
        {message.createdAt && (
          <time>
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        )}
      </div>
    </article>
  );
}
