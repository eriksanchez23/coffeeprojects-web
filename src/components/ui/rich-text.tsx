import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'
import { cn } from '@/lib/cn'

export function RichText({ data, className }: { data: unknown; className?: string }) {
  if (!data) return null
  return (
    <div
      className={cn(
        'max-w-none space-y-5 text-ink-1 [&_a]:text-amber [&_a]:underline [&_h2]:mt-10 [&_h2]:text-2xl [&_h3]:text-xl [&_li]:ml-5 [&_ul]:list-disc',
        className,
      )}
    >
      <LexicalRichText data={data as SerializedEditorState} />
    </div>
  )
}
