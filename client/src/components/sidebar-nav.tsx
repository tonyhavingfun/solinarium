import { Home, Users, Calendar, MessageSquare, User, TreePine, MapPin } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

export default function SidebarNav() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const navItems = [
    { icon: Home, label: t("home"), href: "/" },
    { icon: TreePine, label: t("schools"), href: "/schools" },
    { icon: MessageSquare, label: t("chat"), href: "/chat" },
    { icon: User, label: t("profile"), href: "/profile" },
  ];

  return (
    <aside className="hidden md:flex md:flex-col md:fixed md:left-0 md:top-0 md:h-full md:w-64 md:bg-white dark:md:bg-gray-900 md:border-r md:border-gray-200 dark:md:border-gray-700 md:z-40">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <Link href="/">
          <h1 className="text-2xl font-bold text-orange-500 dark:text-orange-400">
            Solinarium
          </h1>
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 space-y-2">
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
                  "flex items-center w-full px-4 py-3 text-left rounded-lg transition-colors",
                  isActive 
                    ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400" 
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.label}</span>
              </button>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <p>© 2025 Awakened Soul Ventures LLC</p>
          <p className="mt-1">Built for homeschooling families</p>
        </div>
      </div>
    </aside>
  );
}