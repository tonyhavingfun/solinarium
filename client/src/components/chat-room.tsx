import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, ArrowLeft, Heart, Users, Sparkles, User } from "lucide-react";
import { format, parseISO } from "date-fns";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Message, User as UserType } from "@shared/schema";

interface ChatRoomProps {
  type: "community" | "event" | "city" | "user";
  id: number | string;
  name: string;
  onBack: () => void;
}

export default function ChatRoom({ type, id, name, onBack }: ChatRoomProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Add swipe gesture support
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const currentTouch = e.targetTouches[0].clientX;
    const diff = currentTouch - touchStart;
    
    // If swiping right more than 100px, go back
    if (diff > 100) {
      onBack();
      setTouchStart(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  // Dynamic API endpoint based on chat type
  const getApiEndpoint = () => {
    switch (type) {
      case "community":
        return `/api/communities/${id}/messages`;
      case "event":
        return `/api/events/${id}/messages`;
      case "city":
        return `/api/cities/${id}/messages`;
      case "user":
        return `/api/users/${id}/messages`;
      default:
        return `/api/communities/${id}/messages`; // fallback to community
    }
  };

  const { data: messages = [], isLoading } = useQuery<(Message & { sender: UserType })[]>({
    queryKey: [getApiEndpoint()],
    refetchInterval: 1500, // Faster polling like Telegram - every 1.5 seconds
    enabled: !!getApiEndpoint(),
    staleTime: 500, // Consider data stale after 500ms for faster updates
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      // Optimistic update - add message immediately
      const tempMessage = {
        id: Date.now(), // temporary ID
        content,
        senderId: user?.id || '',
        createdAt: new Date().toISOString(),
        sender: user || { id: '', firstName: 'You', lastName: '', email: '', profileImageUrl: null, city: null, numKids: null, bio: null, maritalStatus: null, language: null, theme: null, privacyLevel: null, createdAt: null, updatedAt: null },
        communityId: null,
        eventId: null,
        city: null
      };
      
      queryClient.setQueryData([getApiEndpoint()], (old: any) => [...(old || []), tempMessage]);
      
      const response = await apiRequest("POST", getApiEndpoint(), {
        content,
      });
      return response;
    },
    onSuccess: () => {
      setMessage("");
      // Refetch to get real data and remove optimistic update
      queryClient.invalidateQueries({ queryKey: [getApiEndpoint()] });
    },
    onError: (error: Error) => {
      // Remove optimistic update on error
      queryClient.invalidateQueries({ queryKey: [getApiEndpoint()] });
      console.error("Send message error:", error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error", 
        description: `Failed to send message: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getEncouragingMessage = () => {
    const encouragingMessages = {
      community: [
        "🌟 Welcome to your community space! This is where amazing connections begin.",
        "💫 Share stories, ask questions, and build lasting friendships here.",
        "✨ Your community is waiting for you to start the conversation!",
        "🌈 Every great friendship starts with a simple 'hello' - be the first!"
      ],
      event: [
        "🎉 Event chat is live! Share your excitement and connect with fellow attendees.",
        "🤝 Meet new friends before the event - say hello and introduce yourself!",
        "⭐ This is your space to coordinate, share tips, and build anticipation!",
        "🌟 Connect with other families attending - the fun starts here!"
      ],
      city: [
        "🏙️ Your city community awaits! Connect with families in your neighborhood.",
        "🌆 Discover local families, share recommendations, and build your village.",
        "🗺️ This is where local families gather - jump in and say hello!",
        "🌍 Your local community is stronger when we connect - start the conversation!"
      ],
      user: [
        "💌 Your private conversation space - share thoughts and build friendships.",
        "🤗 A safe space for deeper connections and meaningful conversations.",
        "💝 Personal chats are where real friendships flourish - be authentic!",
        "✨ Connect heart-to-heart with your new friend - the journey begins here!"
      ]
    };

    const typeMessages = encouragingMessages[type] || encouragingMessages.community;
    return typeMessages[Math.floor(Math.random() * typeMessages.length)];
  };

  const getChatTypeIcon = () => {
    switch (type) {
      case "community":
        return <Users className="w-5 h-5 text-orange-500" />;
      case "event":
        return <Sparkles className="w-5 h-5 text-purple-500" />;
      case "city":
        return <Heart className="w-5 h-5 text-blue-500" />;
      case "user":
        return <Heart className="w-5 h-5 text-pink-500" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="h-[600px] flex flex-col">
        <CardContent className="pt-6 text-center py-12">
          Loading messages...
        </CardContent>
      </Card>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col h-screen w-screen bg-white dark:bg-gray-900"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="p-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center space-x-2">
          {getChatTypeIcon()}
          <div>
            <h1 className="font-semibold text-black dark:text-white">{name}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {type === 'community' ? t('communityChat') : 
               type === 'event' ? t('eventChat') : 
               type === 'city' ? t('cityChat') : t('privateChat')}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold mb-3 text-black dark:text-white">
                  Start the Conversation!
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  {getEncouragingMessage()}
                </p>
                <div className="bg-gradient-to-r from-orange-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300">
                  💡 <strong>Tip:</strong> Introduce yourself, share what brought you here, or ask a question to get the conversation flowing!
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Reverse messages to show newest at bottom */}
              {[...messages].reverse().map((msg, index, reversedArray) => {
                const isOwnMessage = msg.senderId === user?.id;
                const senderName = msg.sender.firstName && msg.sender.lastName
                  ? `${msg.sender.firstName} ${msg.sender.lastName}`
                  : msg.sender.email?.split('@')[0] || "User";

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start space-x-3 ${
                      isOwnMessage ? "flex-row-reverse space-x-reverse" : ""
                    } ${
                      // Telegram-style spacing: less space for consecutive messages from same sender
                      index > 0 && reversedArray[index - 1].senderId === msg.senderId ? "mt-1" : "mt-4"
                    }`}
                  >
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={msg.sender.profileImageUrl || ""} />
                      <AvatarFallback className="bg-orange-100 text-orange-600">
                        {msg.sender.firstName?.[0] || msg.sender.email?.[0] || <User className="w-4 h-4" />}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex flex-col max-w-xs lg:max-w-md">
                      {!isOwnMessage && (
                        // Only show name for first message in a group or after time gap
                        index === 0 || reversedArray[index - 1].senderId !== msg.senderId
                      ) && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">
                          {senderName}
                        </span>
                      )}
                      <div
                        className={`px-3 py-2 rounded-2xl max-w-[80%] ${
                          isOwnMessage
                            ? "bg-orange-600 dark:bg-orange-500 text-white ml-auto"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        <div className="space-y-1">
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          <div className={`text-xs leading-none text-right ${
                            isOwnMessage 
                              ? "text-orange-100 dark:text-orange-200" 
                              : "text-gray-500 dark:text-gray-400"
                          }`}>
                            {msg.createdAt ? format(new Date(msg.createdAt), "HH:mm") : "now"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input - Sticky for mobile */}
        <div className="border-t p-4 bg-gray-50 dark:bg-gray-800 sticky bottom-0 z-50">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("typeYourMessage")}
              className="flex-1 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 min-h-[40px]"
              disabled={sendMessageMutation.isPending}
              maxLength={500}
              style={{ 
                fontSize: '16px', // Prevents zoom on iOS
                transform: 'translateZ(0)' // Forces hardware acceleration for better positioning
              }}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 min-h-[40px]"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          {message.length > 400 && (
            <p className="text-xs text-gray-500 mt-1 text-right">
              {500 - message.length} characters remaining
            </p>
          )}
        </div>
      </div>
    </div>
  );
}