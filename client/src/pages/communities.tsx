import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Users } from "lucide-react";
import { Link } from "wouter";
import CommunityCard from "@/components/community-card";
import { isUnauthorizedError } from "@/lib/authUtils";

const createCommunitySchema = z.object({
  name: z.string().min(1, "Community name is required"),
  city: z.string().min(1, "City is required"),
  description: z.string().optional(),
});

type CreateCommunityData = z.infer<typeof createCommunitySchema>;

export default function Communities() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: communities = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/communities"],
    retry: false,
  });

  const form = useForm<CreateCommunityData>({
    resolver: zodResolver(createCommunitySchema),
    defaultValues: {
      name: "",
      city: (user as any)?.city || "",
      description: "",
    },
  });

  const createCommunityMutation = useMutation({
    mutationFn: async (data: CreateCommunityData) => {
      await apiRequest("POST", "/api/communities", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Community created successfully!",
      });
      setIsCreateDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
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
        description: "Failed to create community. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateCommunityData) => {
    createCommunityMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        Loading communities...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Public Header for non-authenticated users */}
      {!isAuthenticated && (
        <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/">
                <div className="flex items-center space-x-2 cursor-pointer">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-semibold text-black">FamilyConnect</span>
                </div>
              </Link>
              
              <div className="flex items-center space-x-4">
                <Link href="/events">
                  <Button variant="ghost" className="text-gray-700 hover:text-orange-500">
                    Events
                  </Button>
                </Link>
                <Button onClick={() => window.location.href = "/api/login"} className="bg-orange-500 hover:bg-orange-600">
                  Join Community
                </Button>
              </div>
            </div>
          </div>
        </header>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">Local Communities</h1>
            <p className="text-lg text-gray-700">Connect with families in your area</p>
          </div>
          
          {isAuthenticated && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Community
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Community</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Community Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Downtown Families" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., San Francisco" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell families about your community..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="submit" 
                      className="flex-1 bg-orange-500 hover:bg-orange-600"
                      disabled={createCommunityMutation.isPending}
                    >
                      {createCommunityMutation.isPending ? "Creating..." : "Create Community"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          )}
        </div>

        {/* Communities Grid */}
        {(communities as any[]).length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-black mb-2">No communities yet</h3>
              <p className="text-gray-600 mb-6">
                Be the first to create a community and connect with families in your area!
              </p>
              {isAuthenticated ? (
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Community
                </Button>
              ) : (
                <Button 
                  onClick={() => window.location.href = "/api/login"}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Join to Create Community
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(communities as any[]).map((community: any) => (
              <CommunityCard key={community.id} community={community} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
