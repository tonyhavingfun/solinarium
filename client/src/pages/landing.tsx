import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Calendar, MessageSquare, MapPin, Plus, ArrowRight, Globe } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import CommunityCard from "@/components/community-card";
import EventCard from "@/components/event-card";
import AuthPopup from "@/components/auth-popup";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTranslation } from "@/hooks/useTranslation";

export default function Landing() {
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const { t, language, setLanguage } = useTranslation();

  const handleLogin = () => {
    setShowAuthPopup(true);
  };

  const { data: communities = [] } = useQuery<any[]>({
    queryKey: ["/api/communities"],
    retry: false,
  });

  const { data: events = [] } = useQuery<any[]>({
    queryKey: ["/api/events"],
    retry: false,
  });

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-black dark:text-white">Soli</span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Language Selector */}
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-20 border-none bg-transparent text-black dark:text-white">
                  <Globe className="w-4 h-4" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <SelectItem value="en">EN</SelectItem>
                  <SelectItem value="lt">LT</SelectItem>
                  <SelectItem value="ru">RU</SelectItem>
                  <SelectItem value="es">ES</SelectItem>
                </SelectContent>
              </Select>
              
              <ThemeToggle />
              <Button onClick={handleLogin} className="bg-orange-500 hover:bg-orange-600">
                {t("login")}
              </Button>
            </div>
          </div>
        </div>
      </header>
      {/* Hero Section */}
      <section className="bg-white dark:bg-gray-900 py-8 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black dark:text-white mb-4 md:mb-6 leading-tight">
              {t("connectFamilies")}.<br />{t("buildCommunities")}.
            </h1>
            <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-6 md:mb-8 max-w-2xl mx-auto px-2">{t("welcomeMessage")}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6 md:mb-8">
              <Button 
                onClick={handleLogin} 
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto px-8 py-3 text-lg"
              >
                {t("findYourCommunity")}
              </Button>
            </div>
            
            {/* Social Proof Avatars */}
            <div className="flex flex-col items-center">
              <div className="flex -space-x-2 mb-4">
                <Avatar className="border-2 border-white dark:border-gray-700 h-12 w-12">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Emma" alt="Emma" />
                  <AvatarFallback>E</AvatarFallback>
                </Avatar>
                <Avatar className="border-2 border-white dark:border-gray-700 h-12 w-12">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos" alt="Carlos" />
                  <AvatarFallback>C</AvatarFallback>
                </Avatar>
                <Avatar className="border-2 border-white dark:border-gray-700 h-12 w-12">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Marie" alt="Marie" />
                  <AvatarFallback>M</AvatarFallback>
                </Avatar>
                <Avatar className="border-2 border-white dark:border-gray-700 h-12 w-12">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Hans" alt="Hans" />
                  <AvatarFallback>H</AvatarFallback>
                </Avatar>
                <Avatar className="border-2 border-white dark:border-gray-700 h-12 w-12">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Yuki" alt="Yuki" />
                  <AvatarFallback>Y</AvatarFallback>
                </Avatar>
                <Avatar className="border-2 border-white dark:border-gray-700 h-12 w-12 bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                  <div className="text-sm font-semibold text-orange-600 dark:text-orange-400">+345</div>
                </Avatar>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("joinFamilies").replace("{count}", "350").replace("{cities}", "25")}
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section className="bg-gray-50 dark:bg-gray-800 py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-black dark:text-white mb-3 md:mb-4">{t("howItWorks")}</h2>
            <p className="text-base md:text-lg text-gray-700 dark:text-gray-300">{t("connectWithFamilies")}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card className="text-center hover:shadow-lg transition-shadow bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
              <CardContent className="pt-4 md:pt-6 pb-4 md:pb-6 px-3 md:px-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <MapPin className="w-5 h-5 md:w-6 md:h-6 text-orange-500 dark:text-orange-400" />
                </div>
                <h3 className="font-semibold text-black dark:text-white mb-1 md:mb-2 text-sm md:text-base">{t("findLocalCommunities")}</h3>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">{t("joinCityGroups")}</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
              <CardContent className="pt-4 md:pt-6 pb-4 md:pb-6 px-3 md:px-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-orange-500 dark:text-orange-400" />
                </div>
                <h3 className="font-semibold text-black dark:text-white mb-1 md:mb-2 text-sm md:text-base">{t("chatWithFamilies")}</h3>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">{t("connectRealTime")}</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
              <CardContent className="pt-4 md:pt-6 pb-4 md:pb-6 px-3 md:px-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <Calendar className="w-5 h-5 md:w-6 md:h-6 text-orange-500 dark:text-orange-400" />
                </div>
                <h3 className="font-semibold text-black dark:text-white mb-1 md:mb-2 text-sm md:text-base">{t("discoverEvents")}</h3>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">{t("findFamilyActivities")}</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
              <CardContent className="pt-4 md:pt-6 pb-4 md:pb-6 px-3 md:px-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <Users className="w-5 h-5 md:w-6 md:h-6 text-orange-500 dark:text-orange-400" />
                </div>
                <h3 className="font-semibold text-black dark:text-white mb-1 md:mb-2 text-sm md:text-base">{t("buildConnections")}</h3>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">{t("createFriendships")}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      {/* Live Communities Preview */}
      <section className="bg-white dark:bg-gray-900 py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 md:mb-8">
            <div className="mb-4 md:mb-0">
              <h2 className="text-2xl md:text-3xl font-bold text-black dark:text-white mb-2">{t("activeCommunities")}</h2>
              <p className="text-base md:text-lg text-gray-700 dark:text-gray-300">{t("seeWhatFamiliesBuilding")}</p>
            </div>
            <Link href="/communities">
              <Button variant="outline" className="hover:border-orange-500 hover:text-orange-500 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                {t("viewAll")} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          
          {communities.length === 0 ? (
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="pt-6 text-center py-12">
                <Users className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-black dark:text-white mb-2">{t("beTheFirst")}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{t("createFirstCommunity")}</p>
                <Button onClick={handleLogin} className="bg-orange-500 hover:bg-orange-600">
                  {t("startACommunity")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {communities.slice(0, 6).map((community) => (
                <CommunityCard key={community.id} community={community} />
              ))}
            </div>
          )}
        </div>
      </section>
      {/* Live Events Preview */}
      <section className="bg-gray-50 dark:bg-gray-800 py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 md:mb-8">
            <div className="mb-4 md:mb-0">
              <h2 className="text-2xl md:text-3xl font-bold text-black dark:text-white mb-2">{t("upcomingEvents")}</h2>
              <p className="text-base md:text-lg text-gray-700 dark:text-gray-300">{t("familyFriendlyActivities")}</p>
            </div>
            <Link href="/events">
              <Button variant="outline" className="hover:border-orange-500 hover:text-orange-500 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                {t("viewAll")} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          
          {events.length === 0 ? (
            <Card className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
              <CardContent className="pt-6 text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-black dark:text-white mb-2">{t("noEventsYet")}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{t("organizeFirstEvent")}</p>
                <Button onClick={handleLogin} className="bg-orange-500 hover:bg-orange-600">
                  {t("createEvent")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              {events.slice(0, 4).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>
      {/* Call to Action */}
      <section className="bg-white dark:bg-gray-900 py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-black dark:text-white mb-3 md:mb-4">Ready to Get Started?</h2>
          <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 mb-6 md:mb-8 px-4">
            Join thousands of families building stronger communities together.
          </p>
          <Button 
            onClick={handleLogin} 
            size="lg" 
            className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto px-8 py-3 text-lg"
          >
            Join Solinarium Today
          </Button>
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-black dark:bg-gray-950 text-white py-8 md:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-2 mb-3 md:mb-4">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <span className="text-lg md:text-xl font-semibold text-white">Solinarium</span>
          </div>
          <p className="text-center text-gray-400 dark:text-gray-300 text-sm md:text-base px-4 mb-2">
            Building stronger communities through family connections.
          </p>
          <p className="text-center text-gray-500 dark:text-gray-400 text-xs md:text-sm">
            An Awakened Soul Ventures LLC Project
          </p>
        </div>
      </footer>
      {/* Auth Popup */}
      <AuthPopup 
        isOpen={showAuthPopup} 
        onClose={() => setShowAuthPopup(false)} 
      />
    </div>
  );
}
