import { platformFooter } from '@unbj/shared'

export function Footer() {
  return (
    <footer className="w-full py-4 px-6 text-center">
      <p className="text-[11px] text-text-secondary tracking-wide">
        {platformFooter}
      </p>
    </footer>
  )
}
