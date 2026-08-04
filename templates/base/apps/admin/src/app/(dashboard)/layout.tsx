import { AuthProvider } from '@/lib/auth'
import { AuthGuard } from '@/components/admin/AuthGuard'
import { Sidebar } from '@/components/admin/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </AuthGuard>
    </AuthProvider>
  )
}
