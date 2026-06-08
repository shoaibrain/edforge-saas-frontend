declare module 'wcag-contrast' {
  export function rgb(foreground: [number, number, number], background: [number, number, number]): number
  export function hex(foreground: string, background: string): number
  export function luminance(r: number, g: number, b: number): number
  export function score(contrast: number): 'AAA' | 'AA' | 'AA Large' | 'Fail'
}
