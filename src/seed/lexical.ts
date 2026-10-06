type Block = { h2: string } | { p: string }

const text = (value: string) => ({ type: 'text', text: value, format: 0, detail: 0, mode: 'normal', style: '', version: 1 })
const base = { format: '', indent: 0, version: 1, direction: 'ltr' as const }

export function lexical(blocks: Block[]) {
  return {
    root: {
      type: 'root',
      ...base,
      children: blocks.map((b) =>
        'h2' in b
          ? { type: 'heading', tag: 'h2', ...base, children: [text(b.h2)] }
          : { type: 'paragraph', ...base, textFormat: 0, children: [text(b.p)] },
      ),
    },
  }
}
