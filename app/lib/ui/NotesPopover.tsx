'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, X } from 'lucide-react';
import BulletDisplay from './BulletDisplay';

interface NotesPopoverProps {
  notes: string | null;
  title?: string; // Optional custom title (defaults to "Notes")
  align?: 'left' | 'right' | 'center'; // Kept for backwards compatibility but not used
}

export function NotesPopover({ notes, title = "Notes" }: NotesPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Handle client-side mounting for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // If no notes, don't render anything
  if (!notes) {
    return <span className="text-blue-300 italic text-xs">No notes</span>;
  }

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        buttonRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    // Close on ESC key
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const popoverContent = isOpen && mounted ? (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div
        ref={popoverRef}
        className="
          w-full max-w-lg
          backdrop-blur-xl bg-white/10 rounded-2xl 
          border border-white/20 shadow-2xl
          animate-in fade-in zoom-in-95 duration-200
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-300" />
              {title}
            </h3>
            <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
                <X className="w-4 h-4 text-blue-300" />
            </button>
            </div>

            {/* Content with Custom Scrollbar */}
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="text-white text-sm leading-relaxed">
                    <BulletDisplay text={notes} />
                </div>
            </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Notes Icon Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
        title="View notes"
      >
        <MessageSquare className="w-4 h-4 text-blue-300 group-hover:text-blue-200 transition-colors" />
      </button>

      {/* Portal: Render popover at document root (outside of table container) */}
      {mounted && popoverContent && createPortal(popoverContent, document.body)}
    </>
  );
}