import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import "./JournalStatus.css";

type JournalStatusProps = {
  status: "pending" | "win" | "loss";
};

const variants = {
  pending: {
    label: "Очікує",
    Icon: Clock3,
  },
  win: {
    label: "Виграш",
    Icon: CheckCircle2,
  },
  loss: {
    label: "Програш",
    Icon: XCircle,
  },
};

export function JournalStatus({ status }: JournalStatusProps) {
  const { label, Icon } = variants[status];

  return (
    <span className={`journal-status-chip journal-status-chip--${status}`}>
      <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
      <span className="journal-status-chip__label">{label}</span>
    </span>
  );
}
