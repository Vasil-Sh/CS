import TelegramGroups from "@/components/analytics/TelegramGroups";
import { logRender } from "@/lib/devLogger";
import "./telegram.css";

export default function Telegram() {
  logRender("Telegram");

  return (
    <div className="min-h-screen bg-[#f4f4f2] relative flex flex-col">
      <div className="telegram-page">
        <TelegramGroups />
      </div>
    </div>
  );
}
