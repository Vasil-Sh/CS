import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  X,
  Zap,
  Lightbulb,
  Shield,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import type { CS2Strategy } from "@/types/strategy";

interface StrategyTemplate {
  name: string;
  description: string;
  riskLevel: "Low" | "Medium" | "High";
  expectedROI: number;
  criteria: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strategies: CS2Strategy[];
  onSave: (strategy: CS2Strategy) => void;
}

const STRATEGY_TEMPLATES: StrategyTemplate[] = [
  {
    name: "Консервативна стратегія",
    description: "Безпечний підхід з низьким ризиком. Підходить для стабільного зростання банку.",
    riskLevel: "Low", expectedROI: 8,
    criteria: ["Мінімальний коефіцієнт 1.3", "Максимальний коефіцієнт 1.8", "Формат тільки BO3", "Тільки ординари", "Аналіз останніх 10 матчів команд"],
  },
  {
    name: "Збалансована стратегія",
    description: "Оптимальне співвідношення ризику та прибутку. Універсальний підхід.",
    riskLevel: "Medium", expectedROI: 15,
    criteria: ["Мінімальний коефіцієнт 1.5", "Максимальний коефіцієнт 2.5", "Формат BO1 та BO3", "Експреси та ординари", "Розмір ставки 2-3% від банку"],
  },
  {
    name: "Агресивна стратегія",
    description: "Високий ризик, високий прибуток. Для досвідчених гравців.",
    riskLevel: "High", expectedROI: 25,
    criteria: ["Мінімальний коефіцієнт 2.0", "Тільки експреси", "Формат BO1 та BO3", "Розмір ставки 5% від банку", "Фокус на андердогах"],
  },
];

const DEFAULT_FORM = {
  name: "",
  description: "",
  criteria: [""],
  riskLevel: "Medium" as "Low" | "Medium" | "High",
  expectedROI: 10,
  blockAfterLosses: 3,
  blockDurationMinutes: 60,
};

function parseCriteriaForValidation(criteria: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  criteria.forEach((criterion) => {
    const lower = criterion.toLowerCase();
    const minOddsMatch = lower.match(/(?:мін|мінімальний|minimum|min).*?коеф.*?(\d+\.?\d*)/i);
    if (minOddsMatch) result.minOdds = parseFloat(minOddsMatch[1]);
    const maxOddsMatch = lower.match(/(?:макс|максимальний|maximum|max).*?коеф.*?(\d+\.?\d*)/i);
    if (maxOddsMatch) result.maxOdds = parseFloat(maxOddsMatch[1]);
    const formatMatch = lower.match(/формат.*?(bo[135](?:,?\s*(?:та|і|and|,)\s*bo[135])*)/i);
    if (formatMatch) {
      const formats = formatMatch[1].toUpperCase().match(/BO[135]/g);
      if (formats) result.allowedFormats = formats;
    }
    if (lower.includes("тільки експрес") || lower.includes("только экспресс")) result.allowedBetTypes = ["Експрес"];
    else if (lower.includes("тільки ординар") || lower.includes("только ординар")) result.allowedBetTypes = ["Ординар"];
    else if (lower.includes("тільки система") || lower.includes("только система")) result.allowedBetTypes = ["Система"];
  });
  return result;
}

export default function CreateStrategyDialog({ open, onOpenChange, strategies, onSave }: Props) {
  const [showTemplates, setShowTemplates] = useState(false);
  const [form, setForm] = useState({ ...DEFAULT_FORM });

  const resetForm = () => setForm({ ...DEFAULT_FORM });

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      resetForm();
      setShowTemplates(false);
    }
  };

  const isTemplateAlreadyCreated = (name: string) =>
    strategies.some((s) => s.name.toLowerCase() === name.toLowerCase());

  const applyTemplate = (template: StrategyTemplate) => {
    if (isTemplateAlreadyCreated(template.name)) return;
    setForm({
      name: template.name,
      description: template.description,
      criteria: [...template.criteria],
      riskLevel: template.riskLevel,
      expectedROI: template.expectedROI,
      blockAfterLosses: 3,
      blockDurationMinutes: 60,
    });
    setShowTemplates(false);
    toast.success(`Шаблон "${template.name}" застосовано!`);
  };

  const addCriterion = () => setForm((prev) => ({ ...prev, criteria: [...prev.criteria, ""] }));
  const updateCriterion = (index: number, value: string) =>
    setForm((prev) => ({ ...prev, criteria: prev.criteria.map((c, i) => (i === index ? value : c)) }));
  const removeCriterion = (index: number) =>
    setForm((prev) => ({ ...prev, criteria: prev.criteria.filter((_, i) => i !== index) }));

  const handleSave = () => {
    if (!form.name.trim() || !form.description.trim()) {
      toast.error("Заповніть назву та опис стратегії");
      return;
    }
    const validCriteria = form.criteria.filter((c) => c.trim() !== "");
    if (validCriteria.length === 0) {
      toast.error("Додайте хоча б один критерій");
      return;
    }
    const existingNames = strategies.map((s) => s.name.toLowerCase());
    if (existingNames.includes(form.name.toLowerCase().trim())) {
      toast.error("Стратегія з такою назвою вже існує. Оберіть іншу назву.");
      return;
    }
    if (strategies.length >= 25) {
      toast.error("Досягнуто ліміту стратегій", {
        description: "Максимум 25 стратегій. Видаліть непотрібні перед створенням нової.",
      });
      return;
    }
    const validationRules = parseCriteriaForValidation(validCriteria);
    const strategy: CS2Strategy = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      description: form.description.trim(),
      criteria: validCriteria,
      riskLevel: form.riskLevel,
      expectedROI: form.expectedROI,
      activityLimits: {
        enabled: true,
        blockAfterLosses: form.blockAfterLosses,
        blockDurationMinutes: form.blockDurationMinutes,
        actionMode: "block",
      },
      ...validationRules,
    };
    onSave(strategy);
    handleOpenChange(false);
  };

  const isValid = form.name.trim() !== '' && form.description.trim() !== '' && form.criteria.some((c) => c.trim() !== '');

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-3xl max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 p-0 gap-0">
        {/* === HEADER === */}
        <DialogHeader className="pt-4 pb-3 px-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-2xl">
              <Sparkles className="h-5 w-5 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Створити нову стратегію
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-0.5">
                Додайте критерії та обмеження для вашої стратегії ставок
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="border-t border-gray-200" />

        {/* === BODY === */}
        <div className="space-y-4 pt-4 pb-4 px-6 bg-gray-100">
          {/* Template button */}
          {!showTemplates && (
            <Button
              type="button"
              onClick={() => setShowTemplates(true)}
              className="w-full rounded-2xl bg-primary hover:bg-blue-400 text-white font-medium h-10 text-sm"
            >
              <Zap className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Використати шаблон
            </Button>
          )}

          {/* Template picker */}
          {showTemplates && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" strokeWidth={1.5} /> Шаблони стратегій
                </h4>
                <Button variant="ghost" size="sm" onClick={() => setShowTemplates(false)} className="rounded-xl text-xs">
                  <X className="h-3 w-3 mr-1" /> Закрити
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {STRATEGY_TEMPLATES.map((template, idx) => {
                  const exists = isTemplateAlreadyCreated(template.name);
                  return (
                    <div
                      key={idx}
                      onClick={() => !exists && applyTemplate(template)}
                      className={`border rounded-2xl p-4 transition-all ${
                        exists
                          ? "bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed"
                          : "bg-white border-gray-200 hover:border-primary cursor-pointer hover:shadow-md"
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-900 mb-1">{template.name}</div>
                      <div className="text-xs text-gray-500 mb-2 line-clamp-2">{template.description}</div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          ROI {template.expectedROI}%
                        </span>
                        {exists && <span className="text-gray-400">Вже створено</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Hint box */}
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <h4 className="font-semibold text-blue-500 mb-2 flex items-center gap-2 text-sm">
              <Lightbulb className="h-4 w-4" strokeWidth={1.5} />
              Як додати обмеження до стратегії:
            </h4>
            <div className="space-y-2 text-sm text-blue-500">
              <p>• <strong>Для обмеження коефіцієнтів:</strong> напишіть "Мінімальний коефіцієнт 1.5"</p>
              <p>• <strong>Для обмеження форматів:</strong> напишіть "Формат тільки BO3"</p>
              <p>• <strong>Для обмеження типів ставок:</strong> напишіть "Тільки експреси"</p>
            </div>
          </div>

          {/* Tilt protection */}
          <div className="p-4 bg-[#FFF5F5] rounded-2xl border-2 border-red-200 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#FEE2E2]">
                <Shield className="h-4 w-4 text-red-600" strokeWidth={2} />
              </div>
              <h4 className="font-semibold text-red-600 text-sm">🔒 Тілт-захист (anti-tilt)</h4>
            </div>
            <p className="text-xs text-red-600/70">
              Автоматично блокує форму ставки після N програшів поспіль.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-500 font-medium text-sm">Блокувати після програшів</Label>
                <Input
                  type="number" min={1} max={10}
                  value={form.blockAfterLosses}
                  onChange={(e) => setForm({ ...form, blockAfterLosses: parseInt(e.target.value) || 3 })}
                  className="rounded-xl border-gray-200 bg-white mt-1.5"
                />
                <p className="text-xs text-gray-400 mt-1">К-сть програшів поспіль</p>
              </div>
              <div>
                <Label className="text-gray-500 font-medium text-sm">Тривалість блокування</Label>
                <div className="relative mt-1.5">
                  <Input
                    type="number" min={15} max={480} step={15}
                    value={form.blockDurationMinutes}
                    onChange={(e) => setForm({ ...form, blockDurationMinutes: parseInt(e.target.value) || 60 })}
                    className="rounded-xl border-gray-200 bg-white pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">хв</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Від 15 до 480 хв</p>
              </div>
            </div>
          </div>

          {/* Name / Risk / ROI row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-base font-medium">Назва стратегії <span className="text-red-600">*</span></Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Наприклад: Консервативна"
                className="rounded-2xl border-gray-200 mt-1.5 h-11 text-base"
              />
            </div>
            <div>
              <Label className="text-base font-medium">Рівень ризику <span className="text-red-600">*</span></Label>
              <Select value={form.riskLevel} onValueChange={(v: "Low" | "Medium" | "High") => setForm({ ...form, riskLevel: v })}>
                <SelectTrigger className="rounded-2xl border-gray-200 mt-1.5 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Низький</SelectItem>
                  <SelectItem value="Medium">Середній</SelectItem>
                  <SelectItem value="High">Високий</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-base font-medium">Очікуваний ROI (%)</Label>
              <Input
                type="number" min={0} max={100}
                value={form.expectedROI}
                onChange={(e) => setForm({ ...form, expectedROI: parseInt(e.target.value) || 0 })}
                className="rounded-2xl border-gray-200 mt-1.5 h-11 text-base"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label className="text-base font-medium">Опис стратегії <span className="text-red-600">*</span></Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Детальний опис стратегії, коли її використовувати..."
              rows={3}
              className="rounded-2xl border-gray-200 mt-1.5"
            />
          </div>

          {/* Criteria */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-base font-medium">Критерії стратегії <span className="text-red-600">*</span></Label>
              <Button
                type="button" variant="outline" size="sm"
                onClick={addCriterion}
                className="rounded-xl bg-blue-50 border-blue-100 font-medium text-blue-500 hover:bg-blue-100"
              >
                <Plus className="h-4 w-4 mr-2" strokeWidth={1.5} /> Додати критерій
              </Button>
            </div>
            <div className="space-y-2">
              {form.criteria.map((criterion, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={criterion}
                    onChange={(e) => updateCriterion(index, e.target.value)}
                    placeholder={index === 0 ? "Наприклад: Мінімальний коефіцієнт 1.5" : `Критерій ${index + 1}`}
                    className="rounded-2xl border-gray-200"
                  />
                  {form.criteria.length > 1 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => removeCriterion(index)} className="rounded-xl border-gray-200">
                      <X className="h-4 w-4" strokeWidth={1.5} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200" />

        {/* === FOOTER === */}
        <DialogFooter className="gap-2 pt-3 pb-4 px-6">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="rounded-3xl border border-gray-200 hover:bg-gray-50 font-medium h-11 px-5 text-base"
          >
            Скасувати
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid}
            className="rounded-3xl bg-primary hover:bg-blue-400 text-white font-medium h-11 px-5 text-base shadow-[0_4px_16px_rgba(68,122,252,0.3)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <Plus className="h-4 w-4 mr-2" /> Створити стратегію
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
