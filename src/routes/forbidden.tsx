import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { ShieldX, ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const Route = createFileRoute('/forbidden')({
  component: ForbiddenPage,
})

function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6"
        >
          <ShieldX className="w-10 h-10 text-red-500" />
        </motion.div>

        <h1 className="text-3xl font-bold text-slate-900 mb-3">
          Access Denied
        </h1>
        <p className="text-slate-500 mb-8">
          You don't have permission to access this resource. 
          This might be because your role doesn't include the required permissions, 
          or you're not assigned to this school.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          <Link to="/">
            <Button className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

