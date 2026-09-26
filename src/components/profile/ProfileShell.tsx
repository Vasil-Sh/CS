import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Trophy,
  Plus,
  BarChart3,
  Target,
  AlertTriangle,
  MessageCircle,
  User,
  TrendingUp,
  LogOut,
  CircleHelp,
  Menu,
  X,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { t } from "@/lib/i18n";
import "@/pages/Profile.css";
import "@/pages/ProfileLanding.css";

const links = [
  ["nav.matches", "/app/matches", Trophy],
  ["nav.addRecord", "/app/my-bets", Plus],
  ["nav.analytics", "/app/analytics", BarChart3],
  ["nav.strategies", "/app/strategy", Target],
  ["nav.riskyTeams", "/app/risky-teams", AlertTriangle],
  ["nav.telegram", "/app/telegram", MessageCircle],
  ["nav.profile", "/app/profile", User],
] as const;

export default function ProfileShell({
  username,
  onLogout,
  children,
}: {
  username: string;
  onLogout: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigation = (
    <>
      <Link to="/app/matches" className="profile-brand">
        <span className="profile-brand-mark">
          <TrendingUp size={23} />
        </span>
        <span className="profile-brand-text">
          Match<span className="profile-brand-iq">IQ</span>
          <small>BET TRACKER</small>
        </span>
      </Link>
      <nav className="profile-nav" aria-label="Основна навігація">
        {links.map(([label, href, Icon]) => (
          <Link
            key={href}
            to={href}
            onClick={() => setOpen(false)}
            aria-current={pathname === href ? "page" : undefined}
          >
            <Icon size={21} strokeWidth={1.6} />
            {t(label)}
          </Link>
        ))}
      </nav>
      <div className="profile-nav-footer">
        <a
          href="https://t.me/cs2beet"
          target="_blank"
          rel="noopener noreferrer"
        >
          <CircleHelp size={20} />
          Допомога та підтримка
        </a>
        <button type="button" onClick={onLogout}>
          <LogOut size={20} />
          {t("app.logout")}
        </button>
      </div>
    </>
  );
  const isProfile = pathname === "/app/profile";
  return (
    <div className={`profile-shell${isProfile ? " profile-landing" : ""}`}>
      <aside className="profile-sidebar">{navigation}</aside>
      {!isProfile && (
        <div className="profile-topbar-user">
          <span className="profile-topbar-avatar">
            {username.charAt(0).toUpperCase()}
          </span>
          <span className="profile-topbar-copy">
            <strong>@{username}</strong>
            <small>
              <i />
              Активний
            </small>
          </span>
        </div>
      )}
      <div className="profile-mobile-header">
        <span className="profile-mobile-brand">
          <span className="profile-brand-mark">
            <TrendingUp size={20} />
          </span>
          <span>
            Match<span className="profile-brand-iq">IQ</span>
          </span>
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Відкрити меню"
        >
          <Menu />
        </button>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className={`profile-mobile-menu${isProfile ? " profile-landing-menu" : ""}`}
        >
          <SheetTitle className="sr-only">Навігація MatchIQ</SheetTitle>
          <button
            className="profile-menu-close"
            onClick={() => setOpen(false)}
            aria-label="Закрити меню"
          >
            <X size={20} />
          </button>
          {navigation}
        </SheetContent>
      </Sheet>
      <main className="profile-main">{children}</main>
    </div>
  );
}
