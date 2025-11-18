'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon } from './icons';

interface Chat {
  id: string;
  project_id: string;
  title: string | null;
  created_at: string;
}

interface ChatListProps {
  projectId: string | null;
  currentChatId: string | null;
  onChatSelect: (chat: Chat) => void;
  onNewChat: () => void;
  onChatDelete: (chatId: string) => void;
}

export default function ChatList({
  projectId,
  currentChatId,
  onChatSelect,
  onNewChat,
  onChatDelete,
}: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadChats();
    }
  }, [projectId]);

  const loadChats = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/chats/list?projectId=${projectId}`);
      const data = await response.json();
      if (data.success) {
        setChats(data.chats);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this chat?')) {
      try {
        await fetch('/api/chats/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId }),
        });
        onChatDelete(chatId);
        loadChats();
      } catch (error) {
        console.error('Failed to delete chat:', error);
      }
    }
  };

  if (!projectId) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 text-sm text-white transition-colors"
      >
        Chats ({chats.length})
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-1 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
            <div className="p-2 border-b border-gray-700">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNewChat();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:bg-gray-700 rounded transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                New Chat
              </button>
            </div>

            {loading ? (
              <div className="p-4 text-sm text-gray-400">Loading...</div>
            ) : chats.length === 0 ? (
              <div className="p-4 text-sm text-gray-400">No chats yet</div>
            ) : (
              <div className="p-2">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`group flex items-center justify-between px-3 py-2 text-sm rounded transition-colors ${
                      currentChatId === chat.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <button
                      onClick={() => {
                        onChatSelect(chat);
                        setIsOpen(false);
                      }}
                      className="flex-1 text-left truncate"
                    >
                      {chat.title || 'Untitled Chat'}
                    </button>
                    <button
                      onClick={(e) => handleDelete(chat.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-600/20 rounded transition-all"
                    >
                      <TrashIcon className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
