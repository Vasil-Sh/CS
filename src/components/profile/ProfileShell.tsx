import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  CalendarDays,
  Plus,
  LineChart,
  Target,
  Flag,
  ShieldAlert,
  Send,
  User,
  LogOut,
  CircleHelp,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
  type LucideIcon,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { t } from "@/lib/i18n";
import { useTheme } from "@/hooks/useTheme";
import "@/pages/Profile.css";
import "@/pages/ProfileLanding.css";
import "./AppShell.css";

const BrandMarkIcon = ({ size = 21 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 16v5" />
    <path d="M16 14v7" />
    <path d="M20 10v11" />
    <path d="m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15" />
    <path d="M4 18v3" />
    <path d="M8 14v7" />
  </svg>
);

const NAV_COLLAPSED_KEY = "matchiq_nav_collapsed";

type NavItem = { label: string; href: string; Icon: LucideIcon };

const getSections = (): { title: string; items: NavItem[] }[] => [
  {
    title: "Головне",
    items: [
      { label: t("nav.matches"), href: "/app/matches", Icon: CalendarDays },
      { label: t("nav.addRecord"), href: "/app/my-bets", Icon: Plus },
      { label: t("nav.analytics"), href: "/app/analytics", Icon: LineChart },
    ],
  },
  {
    title: "Дисципліна",
    items: [
      { label: "Стратегії", href: "/app/strategy", Icon: Target },
      { label: "Цілі", href: "/app/goals", Icon: Flag },
      { label: t("nav.riskyTeams"), href: "/app/risky-teams", Icon: ShieldAlert },
    ],
  },
  {
    title: "Інтеграції",
    items: [{ label: t("nav.telegram"), href: "/app/telegram", Icon: Send }],
  },
];


export default function ProfileShell({
  onLogout,
  children,
}: {
  username: string;
  onLogout: () => void;
  children: ReactNode;
}) {
  useTheme();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(NAV_COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });
  const { pathname } = useLocation();
  const close = () => setOpen(false);
  const toggleCollapsed = () =>
    setCollapsed((value) => {
      const next = !value;
      try {
        localStorage.setItem(NAV_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* storage unavailable — keep in memory only */
      }
      return next;
    });

  const navigation = (compact: boolean) => {
    const navLink = ({ label, href, Icon }: NavItem) => (
      <Link
        key={href}
        to={href}
        className="mq-nav-link"
        aria-current={pathname === href ? "page" : undefined}
        title={compact ? label : undefined}
        onClick={close}
      >
        <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
        <span className="mq-nav-label">{label}</span>
      </Link>
    );
    return (
    <>
      <div className="mq-brand-row">
        <Link
          to="/app/matches"
          className="mq-brand"
          onClick={close}
          aria-label="MatchIQ — матчі"
        >
          <span className="mq-brand-mark">
            <BrandMarkIcon />
          </span>
          <span className="mq-nav-label">MatchIQ</span>
        </Link>
        <button
          type="button"
          className="mq-collapse"
          onClick={toggleCollapsed}
          aria-pressed={compact}
          aria-label={compact ? "Розгорнути меню" : "Згорнути меню"}
          title={compact ? "Розгорнути меню" : "Згорнути меню"}
        >
          {compact ? (
            <ChevronsRight size={16} strokeWidth={2} />
          ) : (
            <ChevronsLeft size={16} strokeWidth={2} />
          )}
        </button>
      </div>
      <nav className="mq-nav" aria-label="Основна навігація">
        {getSections().map((section) => (
          <div className="mq-nav-group" key={section.title}>
            <span className="mq-nav-title">{section.title}</span>
            {section.items.map(navLink)}
          </div>
        ))}
      </nav>
      <div className="mq-nav-footer">
        {navLink({ label: t("nav.profile"), href: "/app/profile", Icon: User })}
        <a
          className="mq-nav-link is-small"
          href="https://t.me/cs2beet"
          target="_blank"
          rel="noopener noreferrer"
          title={compact ? "Допомога та підтримка" : undefined}
        >
          <CircleHelp size={18} strokeWidth={1.8} aria-hidden="true" />
          <span className="mq-nav-label">Допомога та підтримка</span>
        </a>
        <button
          type="button"
          className="mq-nav-link is-small"
          onClick={onLogout}
          title={compact ? t("app.logout") : undefined}
        >
          <LogOut size={18} strokeWidth={1.8} aria-hidden="true" />
          <span className="mq-nav-label">{t("app.logout")}</span>
        </button>
      </div>
    </>
    );
  };

  return (
    <div className={`profile-shell mq-shell${collapsed ? " is-collapsed" : ""}`}>
      <aside className="mq-sidebar">{navigation(collapsed)}</aside>
      <div className="mq-mobile-header">
        <Link to="/app/matches" className="mq-brand">
          <span className="mq-brand-mark">
            <BrandMarkIcon size={19} />
          </span>
          MatchIQ
        </Link>
        <button
          type="button"
          className="mq-menu-button"
          onClick={() => setOpen(true)}
          aria-label="Відкрити меню"
        >
          <Menu size={22} />
        </button>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="mq-mobile-menu">
          <SheetTitle className="sr-only">Навігація MatchIQ</SheetTitle>
          <button
            type="button"
            className="mq-menu-close"
            onClick={close}
            aria-label="Закрити меню"
          >
            <X size={20} />
          </button>
          {navigation(false)}
        </SheetContent>
      </Sheet>
      <main className="profile-main mq-main">{children}</main>
    </div>
  );
}
