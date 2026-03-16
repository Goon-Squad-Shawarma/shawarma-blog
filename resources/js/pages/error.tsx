import { Head, Link } from '@inertiajs/react'
import ErrorToast from '@/components/error-toast'
import WarningToast from '@/components/warning-toast'
import { Button } from '@/components/ui/button'

interface ErrorProps {
  status: number
}

const statusMessages: Record<number, { title: string; description: string }> = {
  403: { title: 'Forbidden', description: "You don't have permission to access this page." },
  404: { title: 'Not Found', description: 'The page you were looking for could not be found.' },
  500: { title: 'Server Error', description: 'Something went wrong on our end. Please try again later.' },
  503: { title: 'Service Unavailable', description: 'We are down for maintenance. Please check back soon.' },
}

export default function Error({ status }: ErrorProps) {
  const { title, description } = statusMessages[status] ?? {
    title: 'Error',
    description: 'An unexpected error occurred.',
  }

  const is404 = status === 404

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
      <Head title={`${status} ${title}`} />

      <p className="text-muted-foreground text-8xl font-bold tracking-tight">{status}</p>
      <h1 className="text-2xl font-semibold">{title}</h1>

      <div className="w-full max-w-sm">
        {is404 ? (
          <WarningToast message={description} />
        ) : (
          <ErrorToast message={description} />
        )}
      </div>

      <Button asChild variant="outline">
        <Link href="/">Go Home</Link>
      </Button>
    </div>
  )
}
