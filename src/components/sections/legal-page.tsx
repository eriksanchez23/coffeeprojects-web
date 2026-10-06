import { Container } from '@/components/ui/container'
import { RichText } from '@/components/ui/rich-text'

export function LegalPage({ title, content }: { title: string; content: unknown }) {
  return (
    <section className="py-20">
      <Container className="max-w-3xl">
        <h1 className="text-4xl font-semibold sm:text-5xl">{title}</h1>
        <RichText data={content} className="mt-10" />
      </Container>
    </section>
  )
}
