import { Target, TrendingUp, AlertTriangle } from "lucide-react";

export function getRiskColor(risk: string): string {
  switch (risk) {
    case "Low":
      return "bg-[#DCFCE7] text-[#16A34A] border-0 rounded-full";
    case "Medium":
      return "bg-[#FEF3C7] text-[#D97706] border-0 rounded-full";
    case "High":
      return "bg-[#FEE2E2] text-[#DC2626] border-0 rounded-full";
    default:
      return "bg-[#F3F4F6] text-[#6B7280] border-0 rounded-full";
  }
}

export function getRiskIcon(risk: string) {
  switch (risk) {
    case "Low":
      return <Target className="h-4 w-4" strokeWidth={1.5} />;
    case "Medium":
      return <TrendingUp className="h-4 w-4" strokeWidth={1.5} />;
    case "High":
      return <AlertTriangle className="h-4 w-4" strokeWidth={1.5} />;
    default:
      return <Target className="h-4 w-4" strokeWidth={1.5} />;
  }
}

export function getRiskLabel(risk: string): string {
  switch (risk) {
    case "Low":
      return "Низький";
    case "Medium":
      return "Середній";
    case "High":
      return "Високий";
    default:
      return risk;
  }
}

export function parseCriteriaForValidation(
  criteria: string[],
): {
  minOdds?: number;
  maxOdds?: number;
  allowedFormats?: string[];
  allowedBetTypes?: string[];
} {
  const result: {
    minOdds?: number;
    maxOdds?: number;
    allowedFormats?: string[];
    allowedBetTypes?: string[];
  } = {};

  criteria.forEach((criterion) => {
    const lowerCriterion = criterion.toLowerCase();

    const minOddsMatch = lowerCriterion.match(
      /(?:мін|мінімальний|minimum|min).*?коеф.*?(\d+\.?\d*)/i,
    );
    if (minOddsMatch) {
      result.minOdds = parseFloat(minOddsMatch[1]);
    }

    const maxOddsMatch = lowerCriterion.match(
      /(?:макс|максимальний|maximum|max).*?коеф.*?(\d+\.?\d*)/i,
    );
    if (maxOddsMatch) {
      result.maxOdds = parseFloat(maxOddsMatch[1]);
    }

    const formatMatch = lowerCriterion.match(
      /формат.*?(bo[135](?:,?\s*(?:та|і|and|,)\s*bo[135])*)/i,
    );
    if (formatMatch) {
      const formats = formatMatch[1].toUpperCase().match(/BO[135]/g);
      if (formats) {
        result.allowedFormats = formats;
      }
    }

    if (
      lowerCriterion.includes("тільки експрес") ||
      lowerCriterion.includes("только экспресс")
    ) {
      result.allowedBetTypes = ["Експрес"];
    } else if (
      lowerCriterion.includes("тільки ординар") ||
      lowerCriterion.includes("только ординар")
    ) {
      result.allowedBetTypes = ["Ординар"];
    } else if (
      lowerCriterion.includes("тільки система") ||
      lowerCriterion.includes("только система")
    ) {
      result.allowedBetTypes = ["Система"];
    } else if (
      lowerCriterion.match(/експрес.*(?:та|і|and).*(?:система|ординар)/i) ||
      lowerCriterion.match(/(?:система|ординар).*(?:та|і|and).*експрес/i)
    ) {
      const betTypes: string[] = [];
      if (
        lowerCriterion.includes("експрес") ||
        lowerCriterion.includes("экспресс")
      )
        betTypes.push("Експрес");
      if (lowerCriterion.includes("ординар")) betTypes.push("Ординар");
      if (lowerCriterion.includes("система")) betTypes.push("Система");
      if (betTypes.length > 0) result.allowedBetTypes = betTypes;
    }
  });

  return result;
}
