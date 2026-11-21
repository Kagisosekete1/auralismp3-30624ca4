import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Search, ArrowLeft, Music2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
  sender_profile?: {
    display_name?: string;
    avatar_url?: string;
  };
}

interface Conversation {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
}

interface InboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRecipientId?: string;
}

const InboxModal = ({ isOpen, onClose, initialRecipientId }: InboxModalProps) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(initialRecipientId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchConversations();
      if (initialRecipientId) {
        setSelectedConversation(initialRecipientId);
        fetchMessages(initialRecipientId);
      }
    }
  }, [isOpen, user, initialRecipientId]);

  useEffect(() => {
    if (!user || !isOpen) return;

    // Subscribe to real-time messages
    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (selectedConversation === newMsg.sender_id) {
            setMessages((prev) => [...prev, newMsg]);
            scrollToBottom();
          }
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isOpen, selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get all messages involving the user
      const { data: messagesData } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (!messagesData) return;

      // Group by conversation partner
      const conversationMap = new Map<string, { messages: Message[]; unread: number }>();
      
      messagesData.forEach((msg) => {
        const partnerId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, { messages: [], unread: 0 });
        }
        const conv = conversationMap.get(partnerId)!;
        conv.messages.push(msg);
        if (msg.recipient_id === user.id && !msg.read_at) {
          conv.unread++;
        }
      });

      // Fetch profiles for conversation partners
      const partnerIds = Array.from(conversationMap.keys());
      if (partnerIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", partnerIds);

      const convs: Conversation[] = partnerIds.map((partnerId) => {
        const profile = profiles?.find((p) => p.user_id === partnerId);
        const convData = conversationMap.get(partnerId)!;
        const lastMsg = convData.messages[0];

        return {
          user_id: partnerId,
          display_name: profile?.display_name || "User",
          avatar_url: profile?.avatar_url,
          last_message: lastMsg?.content,
          last_message_time: lastMsg?.created_at,
          unread_count: convData.unread,
        };
      });

      setConversations(convs);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (partnerId: string) => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("sender_id", partnerId)
        .eq("recipient_id", user.id)
        .is("read_at", null);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !selectedConversation || !newMessage.trim()) return;

    try {
      setSending(true);
      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          recipient_id: selectedConversation,
          content: newMessage.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      void supabase.functions.invoke("send-onesignal", { body: { messageId: data.id } })
        .then(({ error: pushError }) => {
          if (pushError) console.error("Message notification failed:", pushError);
        });
      setMessages((prev) => [...prev, data]);
      setNewMessage("");
      scrollToBottom();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffHours < 168) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const selectedPartner = conversations.find((c) => c.user_id === selectedConversation);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full md:max-w-2xl h-[80vh] md:h-[70vh] glass rounded-t-2xl md:rounded-2xl border border-border/50 overflow-hidden flex flex-col"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 glass-strong p-4 border-b border-border/30 flex items-center gap-3">
            {selectedConversation ? (
              <>
                <motion.button
                  onClick={() => setSelectedConversation(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-elevated/50"
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft className="w-4 h-4 text-foreground" />
                </motion.button>
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  {selectedPartner?.avatar_url ? (
                    <img src={selectedPartner.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full gradient-primary flex items-center justify-center">
                      <span className="text-xs font-bold text-primary-foreground">
                        {(selectedPartner?.display_name || "U")[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <h2 className="font-display font-bold text-foreground flex-1">
                  {selectedPartner?.display_name}
                </h2>
              </>
            ) : (
              <>
                <h2 className="text-xl font-display font-bold text-foreground flex-1">Messages</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-surface-elevated/50 hover:bg-surface-elevated flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </>
            )}
          </div>

          {selectedConversation ? (
            /* Messages View */
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                        msg.sender_id === user?.id
                          ? "gradient-primary text-primary-foreground rounded-tr-md"
                          : "glass border border-border/30 text-foreground rounded-tl-md"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${msg.sender_id === user?.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border/30 glass-strong">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 rounded-xl bg-surface-elevated/50 border border-border/50 text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
                  />
                  <motion.button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {sending ? (
                      <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" />
                    ) : (
                      <Send className="w-5 h-5 text-primary-foreground" />
                    )}
                  </motion.button>
                </div>
              </div>
            </>
          ) : (
            /* Conversations List */
            <div className="flex-1 overflow-y-auto">
              {/* Search */}
              <div className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search messages..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-elevated/50 border border-border/50 text-foreground placeholder:text-muted-foreground outline-none text-sm"
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : conversations.length > 0 ? (
                <div className="space-y-1 px-2">
                  {conversations
                    .filter((c) => c.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((conv) => (
                      <motion.button
                        key={conv.user_id}
                        onClick={() => {
                          setSelectedConversation(conv.user_id);
                          fetchMessages(conv.user_id);
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-elevated/50 transition-colors"
                        whileHover={{ x: 2 }}
                      >
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full overflow-hidden">
                            {conv.avatar_url ? (
                              <img src={conv.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full gradient-primary flex items-center justify-center">
                                <span className="font-bold text-primary-foreground">
                                  {conv.display_name[0].toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          {conv.unread_count > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-foreground truncate">{conv.display_name}</p>
                            {conv.last_message_time && (
                              <span className="text-xs text-muted-foreground">
                                {formatTime(conv.last_message_time)}
                              </span>
                            )}
                          </div>
                          {conv.last_message && (
                            <p className="text-sm text-muted-foreground truncate">{conv.last_message}</p>
                          )}
                        </div>
                      </motion.button>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Music2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No messages yet</p>
                  <p className="text-sm text-muted-foreground/60">Start a conversation with an artist!</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InboxModal;
