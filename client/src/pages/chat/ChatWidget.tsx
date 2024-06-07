import React, {
  ChangeEvent,
  FC,
  KeyboardEvent,
  useEffect,
  useRef,
  useState
} from 'react';
import { sendChatQuestion } from '../../api/httpClient';

type ChatParticipantRole = 'user' | 'assistant';

interface ChatMessage {
  role: ChatParticipantRole;
  text: string;
  error?: boolean;
}

const UnsafeComponent: FC<{ html: string }> = ({ html }) => {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

export const ChatWidget: FC = () => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    messagesRef.current?.lastElementChild?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [chatMessages]);

  const sendMessage = async () => {
    if (userInput.trim() !== '') {
      const userMessage: ChatMessage = { role: 'user', text: userInput };
      setChatMessages([...chatMessages, userMessage]);
      setLoading(true);

      try {
        const response = await sendChatQuestion({ question: userInput });

        const serverMessage: ChatMessage = {
          role: 'assistant',
          text: response.answer
        };
        setChatMessages((messages) => [...messages, serverMessage]);
      } catch (error) {
        setChatMessages((messages) => [
          ...messages,
          {
            role: 'assistant',
            text: 'Chat API error',
            error: true
          }
        ]);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setUserInput(event.target.value);
  };

  const handleKeyDown = async (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      setUserInput('');
      await sendMessage();
    }
  };

  return (
    <div className="chat-widget">
      <div className="messages" ref={messagesRef}>
        {chatMessages.map((msg, index) => (
          <div
            key={index}
            className={`message message-role-${msg.role} ${
              msg.error ? 'message-error' : ''
            }`}
          >
            {msg.role === 'user' ? (
              msg.text
            ) : (
              <UnsafeComponent html={msg.text} />
            )}
          </div>
        ))}
        {loading && (
          <div className={`message message-role-assistant message-loading`}>
            Typing
            <span className="animated-dots">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </div>
        )}
      </div>
      <div className="input-area">
        <textarea
          ref={inputRef}
          value={userInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="form-control"
        />
        <button className="au-btn au-btn--green" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatWidget;
