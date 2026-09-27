import { useLocation } from "react-router-dom";
import StrategyOverview from "@/components/StrategyOverview";
import GoalsManager from "@/components/GoalsManager";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./StrategyWorkspace.css";
export default function StrategyWorkspace() {
  const goals=useLocation().pathname==="/app/goals";
  return <div className="strategy-workspace"><ErrorBoundary key={goals?"goals":"strategies"}>{goals?<GoalsManager focusLayout/>:<StrategyOverview focusLayout/>}</ErrorBoundary></div>;
}
