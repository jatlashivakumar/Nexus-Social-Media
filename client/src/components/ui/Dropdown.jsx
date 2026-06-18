import { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useClickOutside } from '@/hooks/useClickOutside';
import { cn } from '@/utils';

/**
 * Generic dropdown menu.
 * Usage:
 *   <Dropdown
 *     trigger={<button>Open</button>}
 *     items={[{ icon: RiEditLine, label: 'Edit', onClick: fn }, { divider: true }, { label: 'Delete', danger: true, onClick: fn }]}
 *     open={open}
 *     onClose={() => setOpen(false)}
 *     align="right"
 *   />
 */
export default function Dropdown({ trigger, items = [], open, onClose, align = 'right', className }) {
  const ref = useRef(null);
  useClickOutside(ref, onClose);

  return (
    <div ref={ref} className="relative">
      {trigger}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: -6 }}
            animate={{ opacity: 1, scale: 1,    y: 0   }}
            exit={{   opacity: 0, scale: 0.94, y: -6   }}
            transition={{ duration: 0.13, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'absolute z-50 mt-1.5 min-w-[160px] bg-base border border-base rounded-2xl shadow-xl overflow-hidden',
              align === 'right' ? 'right-0' : 'left-0',
              className,
            )}
          >
            {items.map((item, i) =>
              item.divider ? (
                <div key={i} className="h-px bg-base-3 my-1" />
              ) : (
                <button
                  key={i}
                  onClick={() => { item.onClick?.(); onClose?.(); }}
                  disabled={item.disabled}
                  className={cn(
                    'flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-left transition-colors',
                    item.danger
                      ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                      : 'text-primary hover:bg-base-3',
                    item.disabled && 'opacity-40 cursor-not-allowed',
                  )}
                >
                  {item.icon && <item.icon size={15} className="flex-shrink-0" />}
                  <span>{item.label}</span>
                </button>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
