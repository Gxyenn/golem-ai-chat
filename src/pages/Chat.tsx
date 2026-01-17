import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu } from "lucide-react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getAllChats,
  getChat,
  createNewChat,
  addMessageToChat,
  deleteChat,
  type ChatSession,
  type Message,
} from "@/lib/chatStorage";
import { streamMessage, type ChatMessage as GeminiMessage } from "@/lib/gemini";
import golemLogo from "@/assets/golem-logo.png";

const Chat = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chats on mount
  useEffect(() => {
    const loadedChats = getAllChats();
    setChats(loadedChats);
    
    if (loadedChats.length > 0) {
      setCurrentChatId(loadedChats[0].id);
      setMessages(loadedChats[0].messages);
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const handleNewChat = useCallback(() => {
    const newChat = createNewChat();
    setChats(getAllChats());
    setCurrentChatId(newChat.id);
    setMessages([]);
    setSidebarOpen(false);
  }, []);

  const handleSelectChat = useCallback((id: string) => {
    const chat = getChat(id);
    if (chat) {
      setCurrentChatId(id);
      setMessages(chat.messages);
    }
    setSidebarOpen(false);
  }, []);

  const handleDeleteChat = useCallback((id: string) => {
    deleteChat(id);
    const updatedChats = getAllChats();
    setChats(updatedChats);
    
    if (currentChatId === id) {
      if (updatedChats.length > 0) {
        setCurrentChatId(updatedChats[0].id);
        setMessages(updatedChats[0].messages);
      } else {
        setCurrentChatId(null);
        setMessages([]);
      }
    }
  }, [currentChatId]);

  const convertToGeminiHistory = (messages: Message[]): GeminiMessage[] => {
    return messages.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));
  };

  const handleSend = async (
    message: string,
    imageData?: { data: string; mimeType: string }
  ) => {
    let chatId = currentChatId;
    
    // Create new chat if needed
    if (!chatId) {
      const newChat = createNewChat();
      setChats(getAllChats());
      chatId = newChat.id;
      setCurrentChatId(chatId);
    }

    // Add user message
    const userMessage = addMessageToChat(chatId, {
      role: "user",
      content: message,
      imageUrl: imageData ? `data:${imageData.mimeType};base64,${imageData.data}` : undefined,
    });

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setChats(getAllChats());
    setIsLoading(true);
    setStreamingContent("");

    try {
      const history = convertToGeminiHistory(messages);
      
      let fullResponse = "";
      await streamMessage(
        message,
        history,
        (chunk) => {
          fullResponse += chunk;
          setStreamingContent(fullResponse);
        },
        imageData
      );

      // Add AI response
      const aiMessage = addMessageToChat(chatId, {
        role: "assistant",
        content: fullResponse,
      });

      setMessages([...updatedMessages, aiMessage]);
      setChats(getAllChats());
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = addMessageToChat(chatId, {
        role: "assistant",
        content: "Maaf, terjadi kesalahan. Silakan coba lagi.",
      });
      setMessages([...updatedMessages, errorMessage]);
      setChats(getAllChats());
    } finally {
      setIsLoading(false);
      setStreamingContent("");
    }
  };

  return (
    <div className="flex h-screen bg-background dark">
      {/* Sidebar */}
      <ChatSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        chats={chats}
        currentChatId={currentChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl hover:bg-secondary transition-colors lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </motion.button>
            <div className="flex items-center gap-2">
              <img src={golemLogo} alt="Golem AI" className="w-8 h-8 rounded-lg" />
              <h1 className="font-semibold">Golem AI</h1>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-secondary transition-colors"
          >
            <Menu className="w-5 h-5" />
          </motion.button>
        </header>

        {/* Messages */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
          <div className="max-w-3xl mx-auto space-y-6">
            <AnimatePresence mode="popLayout">
              {messages.length === 0 && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center py-16"
                >
                  <motion.img
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.1 }}
                    src={golemLogo}
                    alt="Golem AI"
                    className="w-20 h-20 mx-auto mb-6 rounded-2xl float-animation"
                  />
                  <h2 className="text-2xl font-semibold mb-2">Halo! Saya Golem AI</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Siap membantu Anda dengan berbagai pertanyaan dan tugas. 
                    Ada yang bisa saya bantu hari ini?
                  </p>
                </motion.div>
              )}

              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  imageUrl={msg.imageUrl}
                />
              ))}

              {isLoading && streamingContent && (
                <ChatMessage
                  role="assistant"
                  content={streamingContent}
                  isStreaming
                />
              )}

              {isLoading && !streamingContent && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center overflow-hidden">
                    <img src={golemLogo} alt="Golem AI" className="w-full h-full object-cover" />
                  </div>
                  <div className="chat-bubble-ai px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-border bg-card/50 backdrop-blur-xl">
          <div className="max-w-3xl mx-auto">
            <ChatInput onSend={handleSend} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
