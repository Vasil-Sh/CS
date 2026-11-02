import TelegramGroups from "@/components/analytics/TelegramGroups";
import { logRender } from "@/lib/devLogger";
import "@/components/profile/ProfileRedesign.css";
import "@/components/profile/ProfileSections.css";
import "./telegram.css";

export default function Telegram() {
  logRender("Telegram");

  return (
    <div className="mqp-page telegram-page">
      <div className="mqp-content">
        <TelegramGroups />
      </div>
    </div>
  );
}
