/** The shape of a custom Hairline figure, as hairline-create writes it. */
export type HairlineRead = { textContent: string | null };
export type HairlineMountContext = {
  stage: HTMLElement;
  svg: SVGElement;
  read: HairlineRead;
};
export type HairlineFigureHandle = {
  set(value: number): void;
  destroy(): void;
};
export type HairlineFigureDef = {
  name: string;
  means: string;
  rules: number[];
  /** The figure's own number at intensity 0, 0.5 and 1. */
  range: readonly [number, number, number] | number[];
  tour: ([number, number] | null)[] | null;
  mount(ctx: HairlineMountContext, value: number): HairlineFigureHandle;
};
