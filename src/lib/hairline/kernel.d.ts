// Type declarations for the vendored Hairline kernel (src/lib/hairline/kernel.js).
// The kernel is the @lucasmarkes/hairline src/core, vendored verbatim (MIT);
// it has no upstream types, so we expose a single `any` surface.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const HL: any;

export { HL };
export default HL;
