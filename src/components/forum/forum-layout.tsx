import { OCList } from './oc-list'
import { Separator } from '@/components/ui/separator'
import type { OC } from '@/lib/api/ocs'

interface ForumLayoutProps {
  leftSidebar: React.ReactNode
  children: React.ReactNode
  ocs: OC[]
}

export function ForumLayout({ leftSidebar, children, ocs }: ForumLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - OC List */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-6">
              <div className="border rounded-lg bg-card/50 backdrop-blur">
                <div className="p-4 border-b">
                  <h2 className="font-semibold text-lg">Characters</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ocs.length} {ocs.length === 1 ? 'OC' : 'OCs'} in the world
                  </p>
                </div>
                <OCList ocs={ocs} />
              </div>
            </div>
          </aside>

          {/* Main Content - Post Stream */}
          <main className="lg:col-span-6">
            {children}
          </main>

          {/* Right Sidebar - OC List (Duplicate) */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-6">
              <div className="border rounded-lg bg-card/50 backdrop-blur">
                <div className="p-4 border-b">
                  <h2 className="font-semibold text-lg">Characters</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ocs.length} {ocs.length === 1 ? 'OC' : 'OCs'} in the world
                  </p>
                </div>
                <OCList ocs={ocs} />
              </div>
            </div>
          </aside>

          {/* Mobile/Tablet OC List (Below posts) */}
          <div className="lg:hidden col-span-full">
            <Separator className="my-6" />
            <div className="border rounded-lg bg-card/50 backdrop-blur">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-lg">Characters</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {ocs.length} {ocs.length === 1 ? 'OC' : 'OCs'} in the world
                </p>
              </div>
              <OCList ocs={ocs} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
