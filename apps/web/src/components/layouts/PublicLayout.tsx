import type { PropsWithChildren } from 'react'
import { Header } from '@/components/header/header'
import { Footer } from '@/components/footer/footer'

export function PublicLayout({ children }: PropsWithChildren) {
  return (
    <>
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </>
  )
}
