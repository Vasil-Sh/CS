import { logRender } from "@/lib/devLogger";
import StrategiesScreen from "@/components/strategy/StrategiesScreen";
import "@/components/profile/ProfileRedesign.css";
import "@/components/profile/ProfileSections.css";
import "./telegram.css";

export default function StrategyWorkspace() {
  logRender("Strategies");
  return (
    <div className="mqp-page strategies-page">
      <div className="mqp-content">
        <StrategiesScreen />
      </div>
    </div>
  );
}
