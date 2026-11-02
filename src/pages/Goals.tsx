import { logRender } from "@/lib/devLogger";
import GoalsScreen from "@/components/goals/GoalsScreen";
import "@/components/profile/ProfileRedesign.css";
import "@/components/profile/ProfileSections.css";
import "./telegram.css";

export default function Goals() {
  logRender("Goals");
  return (
    <div className="mqp-page goals-page">
      <div className="mqp-content">
        <GoalsScreen />
      </div>
    </div>
  );
}
