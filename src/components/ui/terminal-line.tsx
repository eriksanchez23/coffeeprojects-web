export function TerminalLine({ prompt = '~ coffeeprojects $', command }: { prompt?: string; command: string }) {
  return (
    <p className="font-mono text-sm text-ink-2">
      <span className="text-mint">{prompt}</span> <span className="text-ink-0">{command}</span>
      <span aria-hidden className="ml-1 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-amber" />
    </p>
  )
}
