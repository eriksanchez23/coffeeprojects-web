import { Bot, CodeXml, Globe, Server, ShoppingCart, Sparkles, Wrench } from 'lucide-react'

const icons = { globe: Globe, 'shopping-cart': ShoppingCart, code: CodeXml, server: Server, bot: Bot, wrench: Wrench, sparkles: Sparkles }

export function ServiceIcon({ name, className }: { name: keyof typeof icons; className?: string }) {
  const Icon = icons[name] ?? Sparkles
  return <Icon aria-hidden className={className ?? 'h-6 w-6 text-amber'} />
}
