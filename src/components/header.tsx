"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Music, Home, Settings, LogIn, Menu } from "lucide-react";
import { useState, memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Componente de navegação otimizado
const NavigationItem = memo(
  ({
    item,
    isActive,
    onClick,
  }: {
    item: { name: string; href: string; icon: any };
    isActive: boolean;
    onClick?: () => void;
  }) => {
    const Icon = item.icon;

    return (
      <Link
        href={item.href}
        onClick={onClick}
        className={`flex items-center space-x-1 transition-colors hover:text-foreground/80 ${
          isActive ? "text-foreground" : "text-foreground/60"
        }`}
      >
        <Icon className="h-4 w-4" />
        <span>{item.name}</span>
      </Link>
    );
  }
);

NavigationItem.displayName = "NavigationItem";

// Componente de navegação mobile otimizado
const MobileNavigationItem = memo(
  ({
    item,
    isActive,
    onClick,
  }: {
    item: { name: string; href: string; icon: any };
    isActive: boolean;
    onClick?: () => void;
  }) => {
    const Icon = item.icon;

    return (
      <Link
        href={item.href}
        onClick={onClick}
        className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
          isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
        }`}
      >
        <Icon className="h-5 w-5" />
        <span className="font-medium">{item.name}</span>
      </Link>
    );
  }
);

MobileNavigationItem.displayName = "MobileNavigationItem";

export function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = useMemo(
    () => [
      {
        name: "Início",
        href: "/",
        icon: Home,
      },
      {
        name: "Louvores",
        href: "/louvores",
        icon: Music,
      },
      {
        name: "Admin",
        href: "/admin",
        icon: Settings,
      },
      {
        name: "Login",
        href: "/login",
        icon: LogIn,
      },
    ],
    []
  );

  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex mx-auto h-14 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
            <Music className="w-4 h-4 text-primary" />
          </div>
          <span className="font-bold text-lg">Hineni</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navigation.map((item) => (
            <NavigationItem
              key={item.name}
              item={item}
              isActive={pathname === item.href}
            />
          ))}
        </nav>

        {/* Right side - Theme Toggle and Mobile Menu */}
        <div className="flex items-center space-x-2">
          <ThemeToggle />

          {/* Mobile Menu */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="md:hidden">
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle className="flex items-center space-x-2">
                  <Music className="w-5 h-5" />
                  <span>Menu</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 space-y-2">
                {navigation.map((item) => (
                  <MobileNavigationItem
                    key={item.name}
                    item={item}
                    isActive={pathname === item.href}
                    onClick={handleMenuClose}
                  />
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
