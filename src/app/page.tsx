import { HeroSection } from '@/components/homepage/hero-section'
import { checkWorldHasOCs, getOCCount } from '@/lib/api/ocs'

export default async function HomePage() {
  const hasOCs = await checkWorldHasOCs()
  const ocCount = await getOCCount()

  return (
    <main className="flex-1">
      <HeroSection hasOCs={hasOCs} ocCount={ocCount} />
    </main>
  )
}
