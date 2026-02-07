'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, X, Save } from 'lucide-react';
import { BulletTextarea } from './BulletTextarea';
import GlassButton from './GlassButton';

interface NotesPopoverInputProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export function NotesPopoverInput({ value, onChange, disabled = false }: NotesPopoverInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [tempValue, setTempValue] = useState(value);
    const [mounted, setMounted] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Handle client-side mounting for portal
    useEffect(() => {
        setMounted(true);
    }, []);

    // Update temp value when prop changes
    useEffect(() => {
        setTempValue(value);
    }, [value]);

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
                setTempValue(value); // Reset to original value
            }
        };

        // Close on ESC key
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
                setTempValue(value); // Reset to original value
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, value]);

    const handleSave = () => {
        onChange(tempValue);
        setIsOpen(false);
    };

    const handleCancel = () => {
        setTempValue(value);
        setIsOpen(false);
    };

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
                        Add Notes
                    </h3>
                    <div className="flex items-center gap-2">
                        <GlassButton
                            icon={Save}
                            onClick={handleSave}
                            tooltip="Save Notes"
                            variant="primary"
                            size="sm"
                        />
                        <GlassButton
                            icon={X}
                            onClick={handleCancel}
                            tooltip="Cancel"
                            variant="secondary"
                            size="sm"
                        />
                    </div>
                </div>

                {/* Content with scrollbar */}
                <div className="p-4">
                    <BulletTextarea
                        value={tempValue}
                        onChange={setTempValue}
                        placeholder="Add any additional notes (each line becomes a bullet point)..."
                        rounded={false}
                        scrollable={true}
                        className="h-[200px]"
                    />
                </div>
            </div>
        </div>
    ) : null;

    const hasNotes = value && value.trim().length > 0;

    return (
        <>
            {/* Notes Icon Button */}
            <button
                ref={buttonRef}
                type="button"
                onClick={() => !disabled && setIsOpen(true)}
                disabled={disabled}
                className={`
          p-2 transition-all group
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
                title={hasNotes ? 'Edit notes' : 'Add notes'}
            >
                <MessageSquare
                    className={`w-5 h-5 transition-colors ${hasNotes ? 'text-blue-400' : 'text-blue-300 group-hover:text-blue-200'
                        }`}
                />
            </button>

            {/* Portal: Render popover at document root */}
            {mounted && popoverContent && createPortal(popoverContent, document.body)}
        </>
    );
}