import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Home,
  FileBarChart,
  Settings,
  User,
  Menu,
  X,
  ListOrdered,
  FileUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Sidebar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  // Close mobile sidebar on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/transactions", label: "Transactions", icon: ListOrdered },
    { href: "/upload", label: "Upload Statements", icon: FileUp },
    { href: "/reports", label: "Reports", icon: FileBarChart },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const NavItems = () => (
    <>
      {navItems.map((item) => {
        const isActive = location === item.href;
        const Icon = item.icon;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center px-3 py-3 text-sm font-medium rounded-md",
              isActive
                ? "bg-[hsl(222.2,47.4%,9.2%)] text-white"
                : "text-gray-300 hover:bg-[hsl(222.2,47.4%,15.2%)] hover:text-white"
            )}
          >
            <Icon className="mr-3 h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </>
  );

  const SidebarContent = () => (
    <>
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center">
          <BarChart3 className="mr-3 h-6 w-6" />
          <h1 className="text-xl font-semibold">Finance Dashboard</h1>
        </div>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white">
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
      <nav className="mt-2 flex-1 overflow-y-auto">
        <div className="space-y-1 px-3">
          <NavItems />
        </div>
      </nav>
      <div className="flex-shrink-0 flex border-t border-[hsl(222.2,47.4%,15.2%)] p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-[hsl(222.2,47.4%,15.2%)] flex items-center justify-center">
              <User className="h-5 w-5 text-gray-300" />
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">Demo User</p>
            <p className="text-xs font-medium text-[hsl(222.2,47.4%,55.2%)]">View Profile</p>
          </div>
        </div>
      </div>
    </>
  );

  // Mobile sidebar uses Sheet component
  if (isMobile) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          className="fixed left-4 top-3 z-50 block md:hidden"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </Button>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="left" className="p-0 w-[280px] bg-[hsl(222.2,47.4%,11.2%)] text-white border-r-0">
            <div className="flex flex-col h-full">
              <SidebarContent />
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop sidebar
  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 bg-[hsl(222.2,47.4%,11.2%)] text-white">
        <SidebarContent />
      </div>
    </div>
  );
}
