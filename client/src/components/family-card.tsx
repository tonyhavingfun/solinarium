import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Users, MessageCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { apiRequest } from "@/lib/queryClient";
import type { User as FamilyUser } from "@shared/schema";

interface FamilyCardProps {
  family: FamilyUser;
}

export default function FamilyCard({ family }: FamilyCardProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const displayName = family.firstName && family.lastName 
    ? `${family.firstName} ${family.lastName}`
    : family.email?.split('@')[0] || "Family";

  // Check friend status
  const { data: friendStatus } = useQuery({
    queryKey: ["/api/friend-status", family.id],
    queryFn: async () => {
      if (!user) return null;
      try {
        const response = await fetch(`/api/friend-status/${family.id}`);
        if (!response.ok) return null;
        return response.json();
      } catch {
        return null;
      }
    },
    enabled: !!user && family.id !== user.id,
  });

  // Send friend request mutation
  const sendFriendRequestMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/friend-requests", { friendId: family.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friend-status", family.id] });
      toast({
        title: "Friend request sent!",
        description: `Your connection request has been sent to ${displayName}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      });
    },
  });

  // Cancel friend request mutation
  const cancelFriendRequestMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/friend-requests/${family.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friend-status", family.id] });
      toast({
        title: "Request cancelled",
        description: "Friend request has been cancelled",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel friend request",
        variant: "destructive",
      });
    },
  });

  const handleConnect = () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to connect with families",
        variant: "destructive",
      });
      return;
    }

    if (friendStatus?.status === "none") {
      sendFriendRequestMutation.mutate();
    } else if (friendStatus?.status === "pending") {
      cancelFriendRequestMutation.mutate();
    } else if (friendStatus?.status === "friends") {
      navigate("/chat");
    }
  };

  const getButtonContent = () => {
    if (!user || family.id === user.id) return null;
    
    if (friendStatus?.status === "friends") {
      return (
        <>
          <MessageCircle className="w-4 h-4 mr-2" />
          {t("chat")}
        </>
      );
    } else if (friendStatus?.status === "pending") {
      return t("waiting");
    } else {
      return t("connect");
    }
  };

  const getButtonColor = () => {
    if (friendStatus?.status === "friends") {
      return "bg-green-500 hover:bg-green-600";
    } else if (friendStatus?.status === "pending") {
      return "bg-gray-500 hover:bg-gray-600";
    } else {
      return "bg-orange-500 hover:bg-orange-600";
    }
  };

  return (
    <Card className="text-center hover:shadow-lg transition-shadow h-80 flex flex-col">
      <CardContent className="pt-6 flex-1 flex flex-col">
        <Avatar className="w-20 h-20 mx-auto mb-4">
          <AvatarImage src={family.profileImageUrl || ""} />
          <AvatarFallback className="text-lg">
            <User className="w-8 h-8" />
          </AvatarFallback>
        </Avatar>
        
        <h3 className="font-semibold text-black mb-1">{displayName}</h3>
        
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-3">
          {family.numKids !== undefined && family.numKids !== null && family.numKids > 0 && (
            <div className="flex items-center">
              <Users className="w-3 h-3 mr-1" />
              <span>{family.numKids} kid{family.numKids !== 1 ? 's' : ''}</span>
            </div>
          )}
          {family.city && (
            <span>• {family.city}</span>
          )}
        </div>
        
        {family.bio && (
          <p className="text-xs text-gray-600 mb-4 line-clamp-2">{family.bio}</p>
        )}
        
        <div className="mt-auto">
          {(!user || family.id === user.id) ? null : (
            <Button 
              onClick={handleConnect}
              size="sm"
              className={getButtonColor()}
              disabled={sendFriendRequestMutation.isPending || cancelFriendRequestMutation.isPending}
            >
              {getButtonContent()}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
