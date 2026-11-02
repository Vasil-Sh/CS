import { logRender } from "@/lib/devLogger";
import RiskRegistry from "@/components/RiskRegistry";
import "@/components/profile/ProfileRedesign.css";
import "@/components/profile/ProfileSections.css";
import "./telegram.css";

export default function RiskyTeams() {
  logRender("RiskyTeams");
  return (
    <div className="mqp-page risky-page">
      <div className="mqp-content">
        <RiskRegistry />
      </div>
    </div>
  );
}
