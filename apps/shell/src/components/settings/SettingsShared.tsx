
import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useSpring, animated, config } from '@react-spring/web'
import { Save, Check, type LucideIcon } from 'lucide-react'
import { Button } from '@edforge/ui'

// ============================================================================
// SHARED SETTINGS COMPONENTS
// ============================================================================

export function SettingsCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between p-4 rounded-xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))]">
            <div>
                <p className="font-medium text-[rgb(var(--text-primary))]">{title}</p>
                <p className="text-sm text-[rgb(var(--text-tertiary))]">{description}</p>
            </div>
            {children}
        </div>
    )
}

export function SettingsRow({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between p-4 rounded-xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))]">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[rgb(var(--surface-tertiary))]">
                    <Icon className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                </div>
                <div>
                    <p className="font-medium text-[rgb(var(--text-primary))]">{title}</p>
                    <p className="text-sm text-[rgb(var(--text-tertiary))]">{description}</p>
                </div>
            </div>
            {action}
        </div>
    )
}

export function SaveButton({ isDirty, isSaving, saveSuccess }: { isDirty: boolean; isSaving: boolean; saveSuccess: boolean }) {
    return (
        <Button type="submit" disabled={!isDirty || isSaving} className="min-w-[110px]">
            <AnimatePresence mode="wait">
                {isSaving ? (
                    <motion.div key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                        Saving...
                    </motion.div>
                ) : saveSuccess ? (
                    <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Saved!
                    </motion.div>
                ) : (
                    <motion.div key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        Save
                    </motion.div>
                )}
            </AnimatePresence>
        </Button>
    )
}

export interface QuickActionProps {
    label: string
    icon: LucideIcon
    href: string
    delay?: number
}

export function QuickActionPill({ label, icon: Icon, href, delay = 0 }: QuickActionProps) {
    const [hovered, setHovered] = useState(false)

    const spring = useSpring({
        scale: hovered ? 1.02 : 1,
        y: hovered ? -2 : 0,
        config: config.wobbly,
    })

    const iconSpring = useSpring({
        rotate: hovered ? 5 : 0,
        scale: hovered ? 1.1 : 1,
        config: { tension: 400, friction: 20 },
    })

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay * 0.05, duration: 0.3 }}
        >
            <Link
                to={href}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                <animated.div
                    style={{
                        transform: spring.scale.to(s => `scale(${s}) translateY(${spring.y.get()}px)`),
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] hover:bg-[rgb(var(--surface-tertiary))] hover:border-teal-500/30 transition-colors cursor-pointer"
                >
                    <animated.div
                        style={{
                            transform: iconSpring.scale.to(s => `scale(${s}) rotate(${iconSpring.rotate.get()}deg)`),
                        }}
                    >
                        <Icon className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                    </animated.div>
                    <span className="text-sm font-medium text-[rgb(var(--text-secondary))]">{label}</span>
                </animated.div>
            </Link>
        </motion.div>
    )
}
