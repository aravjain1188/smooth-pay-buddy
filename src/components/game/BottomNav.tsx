import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingBag, Trophy, User } from "lucide-react";

const items = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/shop", icon: ShoppingBag, label: "Shop" },
  { to: "/leaderboard", icon: Trophy, label: "Ranks" },
  { to: "/profile", icon: User, label: "You" },
];

export function BottomNav() {
  const loc = useLocation();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 glass border-t shadow-soft">
      <div className="mx-auto max-w-2xl grid grid-cols-4">
        {items.map(({ to, icon: Icon, label }) => {
          const active = loc.pathname === to;
          return (
            <Link key={to} to={to} className={`flex flex-col items-center justify-center gap-1 py-3 min-h-[56px] min-w-[44px] transition-all ${active ? "text-primary scale-105" : "text-muted-foreground"}`}>
              <Icon className="size-5" />
              <span className="text-[11px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
