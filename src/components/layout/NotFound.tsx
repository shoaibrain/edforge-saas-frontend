import { motion } from 'framer-motion'
import { Home, ArrowLeft, Search, Compass } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function NotFound() {
  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      window.location.href = '/'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-6">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-100/40 rounded-full blur-3xl" />
      </div>

      <div className="relative text-center max-w-lg">
        {/* Animated 404 */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="mb-8"
        >
          <div className="relative inline-block">
            <motion.span
              className="text-[10rem] font-black text-transparent bg-clip-text bg-gradient-to-br from-brand-400 via-brand-500 to-purple-600 leading-none select-none"
              animate={{ 
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ 
                duration: 5, 
                repeat: Infinity,
                ease: 'linear'
              }}
              style={{ backgroundSize: '200% 200%' }}
            >
              404
            </motion.span>
            
            {/* Floating compass icon */}
            <motion.div
              className="absolute -top-4 -right-4 p-3 bg-white rounded-2xl shadow-lg border border-slate-100"
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              <Compass className="w-8 h-8 text-brand-500" />
            </motion.div>
          </div>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            Page Not Found
          </h1>
          <p className="text-slate-500 text-lg leading-relaxed">
            Oops! The page you're looking for seems to have wandered off. 
            It might have been moved, deleted, or never existed.
          </p>
        </motion.div>

        {/* Search suggestion */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-sm">
            <Search className="w-4 h-4" />
            <span>Try checking the URL or navigate using the buttons below</span>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-4"
        >
          <Button
            variant="outline"
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </motion.div>

        {/* Quick links */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 pt-8 border-t border-slate-200"
        >
          <p className="text-sm text-slate-500 mb-4">Or try one of these:</p>
          <div className="flex items-center justify-center gap-6 text-sm">
            <a href="/" className="text-brand-600 hover:text-brand-700 hover:underline transition-colors">
              Dashboard
            </a>
            <a href="/academics" className="text-brand-600 hover:text-brand-700 hover:underline transition-colors">
              Academics
            </a>
            <a href="/staff" className="text-brand-600 hover:text-brand-700 hover:underline transition-colors">
              Staff
            </a>
            <a href="/settings" className="text-brand-600 hover:text-brand-700 hover:underline transition-colors">
              Settings
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

