import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Exercise } from '../../api/types';
import { chatApi } from '../../api/client';
import { useStudent } from '../../context/StudentContext';
import { SpeechSpeakerButton } from '../common/SpeechSpeakerButton';
import {
  Send,
  Loader2,
  Bot,
  User,
  X,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { clsx } from 'clsx';

interface LessonChatbotProps {
  lessonId: string;
  lessonTitle: string;
  currentExercise?: Exercise;
  isOpen: boolean;
  onToggle: () => void;
}

export const LessonChatbot: React.FC<LessonChatbotProps> = ({
  lessonId,
  lessonTitle,
  currentExercise,
  isOpen,
  onToggle,
}) => {
  const { currentStudent } = useStudent();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hello! I'm your Unfold AI Tutor. I can give you clues, explain questions in simpler terms, or break down difficult words for **${
        currentExercise?.title || lessonTitle
      }**. How can I help you?`,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const quickPrompts = [
    'Give me a helpful clue',
    'Can you explain this in simpler words?',
    'How do I break down this word into sounds?',
    'Why is this concept important?',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isSending || !currentStudent?._id) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputText('');
    setIsSending(true);

    try {
      // Send message along with previous chat history and active exercise context
      const response = await chatApi.sendMessage(
        lessonId,
        currentStudent._id,
        text,
        messages,
        currentExercise?._id,
        currentExercise
      );

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.reply,
        },
      ]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'I had a slight hiccup answering that question. Let me know if you want to try again or ask in a different way!',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={clsx(
        'fixed bottom-6 right-6 z-40 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-200 overflow-hidden',
        isMinimized ? 'w-80 h-16' : 'w-96 md:w-[420px] h-[540px]'
      )}
    >
      {/* Chat Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-brand-600 text-white select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-sm leading-none">Unfold AI Tutor</h4>
            <span className="text-[11px] text-brand-200 truncate max-w-[180px] block">
              {currentExercise ? currentExercise.title : lessonTitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
            aria-label={isMinimized ? 'Expand Chat' : 'Minimize Chat'}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
            aria-label="Close Chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50 dark:bg-slate-950/30">
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={idx}
                  className={clsx(
                    'flex items-start gap-2.5 animate-fadeIn',
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  <div
                    className={clsx(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 shadow-sm',
                      isUser
                        ? 'bg-brand-600 text-white'
                        : 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                    )}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div
                    className={clsx(
                      'p-3.5 rounded-2xl max-w-[80%] text-xs md:text-sm leading-relaxed shadow-sm space-y-1.5',
                      isUser
                        ? 'bg-brand-600 text-white rounded-tr-none'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-150 dark:border-slate-700'
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {!isUser && (
                      <div className="pt-1 flex justify-end">
                        <SpeechSpeakerButton
                          text={msg.content}
                          size="sm"
                          variant="ghost"
                          className="opacity-70 hover:opacity-100"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="flex items-center gap-2.5 text-slate-400 text-xs py-2">
                <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                <span>Unfold Tutor is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                disabled={isSending}
                className="whitespace-nowrap px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-950 text-slate-600 dark:text-slate-300 text-[11px] font-medium rounded-full border border-slate-200 dark:border-slate-700 transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                💡 {prompt}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask a question or for a hint..."
              disabled={isSending}
              className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="p-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl shadow transition-all cursor-pointer"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </>
      )}
    </div>
  );
};
