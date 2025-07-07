import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Chrome, Apple, Facebook, Github } from "lucide-react";

interface AuthPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthPopup({ isOpen, onClose }: AuthPopupProps) {
  const [isLogin, setIsLogin] = useState(true);

  const handleSocialLogin = (provider: string) => {
    // For now, all social logins redirect to Replit auth
    window.location.href = "/api/login";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            {isLogin ? "Welcome Back" : "Join FamilyConnect"}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            {isLogin 
              ? "Sign in to connect with families in your area" 
              : "Create your account and start building connections"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Social Login Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => handleSocialLogin("google")}
              variant="outline"
              className="w-full flex items-center justify-center gap-3 h-12 hover:bg-gray-50"
            >
              <Chrome className="w-5 h-5" />
              Continue with Google
            </Button>

            <Button
              onClick={() => handleSocialLogin("apple")}
              variant="outline"
              className="w-full flex items-center justify-center gap-3 h-12 hover:bg-gray-50"
            >
              <Apple className="w-5 h-5" />
              Continue with Apple
            </Button>

            <Button
              onClick={() => handleSocialLogin("facebook")}
              variant="outline"
              className="w-full flex items-center justify-center gap-3 h-12 hover:bg-gray-50"
            >
              <Facebook className="w-5 h-5" />
              Continue with Facebook
            </Button>

            <Button
              onClick={() => handleSocialLogin("github")}
              variant="outline"
              className="w-full flex items-center justify-center gap-3 h-12 hover:bg-gray-50"
            >
              <Github className="w-5 h-5" />
              Continue with GitHub
            </Button>
          </div>

          <div className="relative">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-white px-2 text-sm text-gray-500">Or continue with Replit</span>
            </div>
          </div>

          <Button
            onClick={() => window.location.href = "/api/login"}
            className="w-full bg-orange-500 hover:bg-orange-600 h-12"
          >
            Continue with Replit Auth
          </Button>

          <div className="text-center text-sm text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center leading-relaxed">
            By continuing, you agree to our Terms of Service and Privacy Policy. 
            We're committed to protecting your family's privacy and safety.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}