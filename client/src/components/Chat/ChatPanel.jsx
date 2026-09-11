import React, { useState, useRef, useEffect } from 'react';
import { SOCKET_EVENTS } from '../../constants/events';

export function ChatPanel({ socket, messages, isDrawer, myPlayer }) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const hasGuessed = myPlayer?.hasGuessedCorrectly;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = inputText.trim();
    if (!clean || !socket) return;

    if (isDrawer || hasGuessed) {
      // General chat
      socket.emit(SOCKET_EVENTS.CHAT, { text: clean });
    } else {
      // Send as guess
      socket.emit(SOCKET_EVENTS.GUESS, { text: clean });
    }

    setInputText('');
  };

  const getPlaceholder = () => {
    if (isDrawer) return "You're drawing! (Chat only)";
    if (hasGuessed) return "You guessed it! (Chat only)";
    return "Type your guess here...";
  };

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {messages.map((msg) => {
          if (msg.isSystem) {
            return (
              <div
                key={msg.id}
                className={`chat-item ${msg.isCorrect ? 'correct' : 'system'}`}
              >
                {msg.text}
              </div>
            );
          }

          return (
            <div key={msg.id} className="chat-item">
              <span className="chat-sender">{msg.playerName}:</span>
              <span>{msg.text}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-input-bar">
        <input
          type="text"
          className="chat-input"
          placeholder={getPlaceholder()}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          maxLength={100}
        />
        <button type="submit" className="chat-send-btn">
          Send
        </button>
      </form>
    </div>
  );
}
