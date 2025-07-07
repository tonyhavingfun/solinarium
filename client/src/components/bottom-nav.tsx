import { Home, Users, Calendar, MessageSquare, User, TreePine } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  isHidden?: boolean;
}

export default function BottomNav({ isHidden = false }: BottomNavProps) {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const navItems = [
    { icon: Home, label: t("home"), href: "/" },
    { icon: TreePine, label: t("schools"), href: "/schools" },
    { icon: MessageSquare, label: t("chat"), href: "/chat" },
    { icon: User, label: t("profile"), href: "/profile" },
  ];

  // Don't show bottom nav on desktop (hidden on md+ screens)
  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 md:hidden z-50 transition-transform duration-200",
      isHidden ? "translate-y-full" : "translate-y-0"
    )}>
      <div className="flex justify-around items-center px-2 py-2 w-full">
        {navItems.map((item) => {
          const isActive = location === item.href || 
            (item.href === "/chat" && location.startsWith("/chat/"));
          const Icon = item.icon;
          
          // For protected routes, show login redirect for non-authenticated users
          const needsAuth = ["/chat", "/profile"].includes(item.href);
          const href = needsAuth && !isAuthenticated ? "/api/login" : item.href;
          
          return (
            <Link key={item.href} href={href}>
              <button
                className={cn(
                  "flex flex-col items-center justify-center px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap",
                  isActive 
                    ? "text-orange-500 dark:text-orange-400" 
                    : "text-gray-500 dark:text-gray-400"
                )}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span>{item.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}