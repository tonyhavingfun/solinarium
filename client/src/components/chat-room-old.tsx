import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, User, ArrowLeft, Heart, Users, Sparkles } from "lucide-react";
import { format, parseISO } from "date-fns";
import { isUnauthorizedError } from "@/lib/authUtils";

interface ChatRoomProps {
  type: "community" | "event" | "city" | "user";
  id: number | string;
  name: string;
  onBack: () => void;
}

export default function ChatRoom({ type, id, name, onBack }: ChatRoomProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        return "";
    }
  };

  const { data: messages = [], isLoading, refetch } = useQuery({
    queryKey: [getApiEndpoint()],
    refetchInterval: 3000, // Poll for new messages every 3 seconds
    enabled: !!getApiEndpoint(),
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest("POST", getApiEndpoint(), {
        content,
      });
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: [getApiEndpoint()] });
    },
    onError: (error: Error) => {
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
        description: "Failed to send message. Please try again.",
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          Loading messages...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <>
              {/* Reverse messages to show newest at bottom */}
              {[...messages].reverse().map((msg) => {
                const isOwnMessage = msg.senderId === user?.id;
                const senderName = msg.sender.firstName && msg.sender.lastName
                  ? `${msg.sender.firstName} ${msg.sender.lastName}`
                  : msg.sender.email?.split('@')[0] || "User";

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start space-x-3 ${
                      isOwnMessage ? "flex-row-reverse space-x-reverse" : ""
                    }`}
                  >
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={msg.sender.profileImageUrl || ""} />
                      <AvatarFallback>
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={`flex-1 ${isOwnMessage ? "text-right" : ""}`}>
                      <div
                        className={`inline-block px-3 py-2 rounded-lg max-w-xs lg:max-w-md ${
                          isOwnMessage
                            ? "bg-orange-500 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {senderName} • {format(parseISO(msg.createdAt), "h:mm a")}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              disabled={sendMessageMutation.isPending}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
