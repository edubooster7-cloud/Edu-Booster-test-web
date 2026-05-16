"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { APP_PAGES } from "@/lib/auth/auth.constants";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  FileText,
  GraduationCap,
  LogOut,
  Menu,
  Settings,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Logo from "./logo";
import { NotificationBell } from "./NotificationBell";

interface SubItem {
  label: string;
  href: (userId: string) => string;
}

interface NavItem {
  label: string;
  href: (userId: string) => string;
  icon: React.ElementType;
  children?: SubItem[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Cours",
    href: (id) => `/accounts/${id}/courses`,
    icon: BookOpen,
  },
  {
    label: "Abonnement",
    href: (id) => `/accounts/${id}/subscription`,
    icon: CreditCard,
  },
  {
    label: "Factures",
    href: (id) => `/accounts/${id}/factures`,
    icon: FileText,
  },
  {
    label: "Profil",
    href: (id) => `/accounts/${id}/profile`,
    icon: User,
  },
  {
    label: "Wallet",
    href: (id) => `/accounts/${id}/wallet`,
    icon: DollarSign,
  },
  {
    label: "Paramètres",
    href: (id) => `/accounts/${id}/settings`,
    icon: Settings,
    children: [
      {
        label: "Notifications",
        href: (id) => `/accounts/${id}/settings/notifications`,
      },
      {
        label: "Rappels",
        href: (id) => `/accounts/${id}/settings/reminders`,
      },
      {
        label: "Sécurité",
        href: (id) => `/accounts/${id}/settings/security`,
      },
    ],
  },
];

function NavItemRow({
  item,
  userId,
  collapsed,
  onClick,
}: {
  item: NavItem;
  userId: string;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const resolvedHref = item.href(userId);
  const isParentActive = pathname.startsWith(resolvedHref);

  const [subOpen, setSubOpen] = useState(isParentActive);
  const Icon = item.icon;
  const hasChildren = !!item.children?.length;

  if (hasChildren && !collapsed) {
    return (
      <div>
        <button
          onClick={() => setSubOpen((o) => !o)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 w-full",
            "hover:bg-accent hover:text-accent-foreground",
            isParentActive ? "text-primary" : "text-muted-foreground",
          )}
        >
          <Icon className="w-4.5 h-4.5 shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 transition-transform duration-200",
              subOpen && "rotate-180",
            )}
          />
        </button>

        {subOpen && (
          <div className="ml-7.5 mt-0.5 flex flex-col gap-0.5 border-l border-border pl-3">
            {item.children!.map((child) => {
              const childHref = child.href(userId);
              const childActive = pathname === childHref;
              return (
                <Link
                  key={childHref}
                  href={childHref}
                  onClick={onClick}
                  className={cn(
                    "flex items-center rounded-md px-2 py-2 text-sm transition-all duration-150",
                    "hover:bg-accent hover:text-accent-foreground",
                    childActive
                      ? "text-primary font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  {child.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={resolvedHref}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
        "hover:bg-accent hover:text-accent-foreground",
        isParentActive ? "bg-primary/10 text-primary" : "text-muted-foreground",
        collapsed && "justify-center px-2",
      )}
      title={collapsed ? item.label : undefined}
    >
      <Icon className="w-4.5 h-4.5 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

function UserStrip({
  collapsed,
  onLogout,
}: {
  collapsed: boolean;
  onLogout: () => void;
}) {
  const { user } = useAuth();

  return (
    <div className="p-2 border-t border-border flex flex-col gap-1">
      {!collapsed && user && (
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-accent/40 mb-1">
          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-primary">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground truncate">
              {user.name}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </div>
      )}

      <button
        onClick={onLogout}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 w-full",
          "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
          collapsed && "justify-center px-2",
        )}
        title={collapsed ? "Déconnexion" : undefined}
      >
        <LogOut className="w-4.5 h-4.5 shrink-0" />
        {!collapsed && <span>Déconnexion</span>}
      </button>
    </div>
  );
}

export function DesktopSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const userId = user?.id ?? "";

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen sticky top-0 border-r border-border bg-card transition-all duration-300 shrink-0",
        collapsed ? "w-16" : "w-55",
      )}
    >
      <div
        className={cn(
          "flex items-center px-4 py-4 border-b border-border",
          collapsed && "justify-center px-2",
        )}
      >
        {!collapsed && (
          <Logo
            className="size-20"
            href={`${APP_PAGES.DASHBOARD(`${user?.id}`)}`}
          />
        )}
      </div>

      <nav className="flex-1 flex flex-col gap-1 p-2 pt-3 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavItemRow
            key={item.label}
            item={item}
            userId={userId}
            collapsed={collapsed}
          />
        ))}
      </nav>

      <div className="px-2 pb-1">
        <NotificationBell collapsed={collapsed} />
      </div>

      <UserStrip collapsed={collapsed} onLogout={logout} />

      {/* Collapse toggle */}
      <div className="px-2 pb-2">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-accent w-full transition-all",
            collapsed && "justify-center px-2",
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Réduire</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

// ─── Mobile header + drawer ───────────────────────────────────────────────────

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const userId = user?.id ?? "";

  const handleLogout = async () => {
    setOpen(false);
    await logout();
  };

  return (
    <>
      <header className="md:hidden flex items-center justify-between px-4 h-14 border-b border-border bg-card sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <GraduationCap className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm text-foreground">
            EduBooster
          </span>
        </div>

        <div className="flex items-center gap-1">
          <NotificationBell />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setOpen(true)}
          >
            <Menu className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-65 bg-card border-r border-border flex flex-col transition-transform duration-300 md:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <GraduationCap className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm text-foreground">
              EduBooster
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <nav className="flex-1 flex flex-col gap-1 p-2 pt-3 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavItemRow
              key={item.label}
              item={item}
              userId={userId}
              collapsed={false}
              onClick={() => setOpen(false)}
            />
          ))}
        </nav>

        <UserStrip collapsed={false} onLogout={handleLogout} />
      </div>
    </>
  );
}
