import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Heart, 
  Phone, 
  Globe, 
  MessageCircle, 
  MapPin, 
  Users, 
  Star,
  Calendar,
  DollarSign,
  GraduationCap,
  Camera,
  MessageSquare,
  Send
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import type { School, SchoolPost, SchoolTeacher, SchoolPhoto } from "@shared/schema";

export default function SchoolDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newPost, setNewPost] = useState("");
  const [newComment, setNewComment] = useState("");

  // Fetch school details
  const { data: school, isLoading } = useQuery({
    queryKey: ["/api/schools", id],
  }) as { data: School; isLoading: boolean };

  // Fetch school posts
  const { data: posts = [] } = useQuery({
    queryKey: ["/api/schools", id, "posts"],
    enabled: !!id,
  }) as { data: SchoolPost[] };

  // Fetch school teachers
  const { data: teachers = [] } = useQuery({
    queryKey: ["/api/schools", id, "teachers"],
    enabled: !!id,
  }) as { data: SchoolTeacher[] };

  // Fetch school photos
  const { data: photos = [] } = useQuery({
    queryKey: ["/api/schools", id, "photos"],
    enabled: !!id,
  }) as { data: SchoolPhoto[] };

  // Fetch school attendees
  const { data: attendees = [] } = useQuery({
    queryKey: ["/api/schools", id, "attendees"],
    enabled: !!id,
  });

  // Add to favorites mutation
  const addToFavoritesMutation = useMutation({
    mutationFn: () => 
      apiRequest("POST", `/api/schools/${id}/favorite`),
    onSuccess: () => {
      toast({ description: "Added to favorites" });
    },
  });

  // Join school mutation
  const joinSchoolMutation = useMutation({
    mutationFn: () => 
      apiRequest("POST", `/api/schools/${id}/attend`, { methodId: 1, status: "interested" }),
    onSuccess: () => {
      toast({ description: "Joined school successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/schools", id] });
    },
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: (content: string) => 
      apiRequest("POST", `/api/schools/${id}/posts`, { content, type: "text" }),
    onSuccess: () => {
      setNewPost("");
      toast({ description: "Post created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/schools", id, "posts"] });
    },
  });

  if (isLoading || !school) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-lg">{isLoading ? t("loading") : "School not found"}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 pb-24">
      {/* School Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* School Cover Photo */}
          <div className="md:w-1/3">
            <div className="aspect-square rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden">
              {school.coverPhoto ? (
                <img 
                  src={school.coverPhoto} 
                  alt={school.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <GraduationCap className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* School Info */}
          <div className="md:w-2/3">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
                  {school.name}
                </h1>
                <div className="flex items-center text-gray-600 dark:text-gray-300 mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  {school.city}
                </div>
                {school.address && (
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {school.address}
                  </div>
                )}
              </div>
              {isAuthenticated && (
                <Button
                  variant="outline"
                  onClick={() => addToFavoritesMutation.mutate()}
                  disabled={addToFavoritesMutation.isPending}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  {t("addToFavorites")}
                </Button>
              )}
            </div>

            {/* School Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {school.ageRange && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">{t("ageRange")}</div>
                  <div className="font-medium">{school.ageRange}</div>
                </div>
              )}
              {school.capacity && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">{t("capacity")}</div>
                  <div className="font-medium">{school.capacity} students</div>
                </div>
              )}
              {school.yearEstablished && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">{t("yearEstablished")}</div>
                  <div className="font-medium">{school.yearEstablished}</div>
                </div>
              )}
              {school.priceRange && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">{t("priceRange")}</div>
                  <div className="font-medium">{t(school.priceRange)}</div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {isAuthenticated && (
                <Button 
                  onClick={() => joinSchoolMutation.mutate()}
                  disabled={joinSchoolMutation.isPending}
                >
                  <Users className="w-4 h-4 mr-2" />
                  {t("joinSchool")}
                </Button>
              )}
              
              {school.phone && (
                <Button
                  variant="outline"
                  onClick={() => window.open(`tel:${school.phone}`)}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  {t("callSchool")}
                </Button>
              )}
              
              {school.website && (
                <Button
                  variant="outline"
                  onClick={() => window.open(school.website, "_blank")}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  {t("visitWebsite")}
                </Button>
              )}
              
              {school.whatsapp && (
                <Button
                  variant="outline"
                  onClick={() => window.open(`https://wa.me/${school.whatsapp.replace(/\D/g, '')}`, "_blank")}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {t("whatsapp")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* School Content Tabs */}
      <Tabs defaultValue="about" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="about">{t("aboutSchool")}</TabsTrigger>
          <TabsTrigger value="teachers">{t("teachers")}</TabsTrigger>
          <TabsTrigger value="photos">{t("photos")}</TabsTrigger>
          <TabsTrigger value="community">{t("communityWall")}</TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("aboutSchool")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {school.description || school.shortDescription}
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t("contactInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {school.email && (
                <div className="flex items-center">
                  <span className="w-20 text-sm text-gray-600 dark:text-gray-300">Email:</span>
                  <a 
                    href={`mailto:${school.email}`}
                    className="text-orange-600 dark:text-orange-400 hover:underline"
                  >
                    {school.email}
                  </a>
                </div>
              )}
              {school.phone && (
                <div className="flex items-center">
                  <span className="w-20 text-sm text-gray-600 dark:text-gray-300">Phone:</span>
                  <a 
                    href={`tel:${school.phone}`}
                    className="text-orange-600 dark:text-orange-400 hover:underline"
                  >
                    {school.phone}
                  </a>
                </div>
              )}
              {school.website && (
                <div className="flex items-center">
                  <span className="w-20 text-sm text-gray-600 dark:text-gray-300">Website:</span>
                  <a 
                    href={school.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 dark:text-orange-400 hover:underline"
                  >
                    {school.website}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attending Families */}
          {Array.isArray(attendees) && attendees.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("attendingFamilies")} ({Array.isArray(attendees) ? attendees.length : 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Array.isArray(attendees) && attendees.slice(0, 6).map((attendee: any) => (
                    <div key={attendee.id} className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={attendee.user?.profileImageUrl || ""} />
                        <AvatarFallback>
                          {attendee.user?.firstName?.[0] || "U"}{attendee.user?.lastName?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">
                          {attendee.user?.firstName || "Unknown"} {attendee.user?.lastName || "User"}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          {attendee.user?.city || "Location not specified"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="teachers" className="space-y-6 mt-6">
          {teachers.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-300">No teachers listed yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {teachers.map((teacher) => (
                <Card key={teacher.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={teacher.photo || undefined} />
                        <AvatarFallback>
                          {teacher.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{teacher.name}</h3>
                        {teacher.yearsExperience && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            {teacher.yearsExperience} years experience
                          </p>
                        )}
                        {teacher.bio && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                            {teacher.bio}
                          </p>
                        )}
                        {teacher.specializations && (
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-gray-600 dark:text-gray-300">
                              Specializations:
                            </div>
                            <p className="text-sm">{teacher.specializations}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="photos" className="space-y-6 mt-6">
          {photos.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Camera className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-300">No photos uploaded yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img 
                    src={photo.url} 
                    alt={photo.caption || "School photo"}
                    className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => window.open(photo.url, "_blank")}
                  />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="community" className="space-y-6 mt-6">
          {/* Post Creation */}
          {isAuthenticated && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Textarea
                    placeholder={t("writePost")}
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button 
                      onClick={() => createPostMutation.mutate(newPost)}
                      disabled={!newPost.trim() || createPostMutation.isPending}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Post
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Posts */}
          <div className="space-y-6">
            {posts.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-300">No posts yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Be the first to share something with the community!
                  </p>
                </CardContent>
              </Card>
            ) : (
              posts.map((post: any) => (
                <Card key={post.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar>
                        <AvatarImage src={post.author?.profileImageUrl || ""} />
                        <AvatarFallback>
                          {post.author?.firstName?.[0] || "U"}{post.author?.lastName?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium">
                            {post.author?.firstName || "Unknown"} {post.author?.lastName || "User"}
                          </span>
                          <span className="text-sm text-gray-500">
                            {format(new Date(post.createdAt), "MMM d, yyyy")}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                          {post.content}
                        </p>
                        
                        {/* Comments */}
                        {post.comments && post.comments.length > 0 && (
                          <div className="border-t pt-4 space-y-3">
                            {post.comments.map((comment: any) => (
                              <div key={comment.id} className="flex items-start space-x-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={comment.author?.profileImageUrl || ""} />
                                  <AvatarFallback className="text-xs">
                                    {comment.author?.firstName?.[0] || "U"}{comment.author?.lastName?.[0] || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-sm font-medium">
                                      {comment.author.firstName} {comment.author.lastName}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {format(new Date(comment.createdAt), "MMM d")}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">
                                    {comment.content}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}