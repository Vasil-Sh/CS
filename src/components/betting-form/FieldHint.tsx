import type { ReactNode } from 'react';

/** Wraps a form field with conditional hint styling when showHints && isEmpty */
export function FieldHint({
  showHints,
  isEmpty,
  children,
  hint = 'Заповніть це поле',
}: {
  showHints: boolean;
  isEmpty: boolean;
  children: ReactNode;
  hint?: string;
}) {
  const show = showHints && isEmpty;
  return (
    <div className="space-y-1.5">
      {children}
      {show && (
        <p className="text-xs text-red-500 font-medium animate-in fade-in slide-in-from-top-1 pl-1">
          ⚠ {hint}
        </p>
      )}
    </div>
  );
}

/** Returns classnames with hint style when field is empty */
export function hintInputClass(baseClass: string, showHints: boolean, isEmpty: boolean): string {
  if (showHints && isEmpty) {
    return `${baseClass} ring-2 ring-red-300 border-red-400 focus:ring-red-400 focus:border-red-400`;
  }
  return baseClass;
}
