'use client';

interface BulletDisplayProps {
  text: string;
  className?: string;
}

export default function BulletDisplay({ text, className = '' }: BulletDisplayProps) {
  if (!text) return null;

  // Split by newlines and filter empty lines
  const lines = text.split('\n').filter(line => line.trim());

  // If only one line, don't show bullet
  if (lines.length === 1) {
    return <div className={className}>{lines[0].trim()}</div>;
  }

  // Multiple lines - show each with a bullet
  return (
    <div className={className}>
      {lines.map((line, index) => {
        const trimmedLine = line.trim();
        // Remove bullet if it already exists
        const cleanLine = trimmedLine.startsWith('•') 
          ? trimmedLine.substring(1).trim() 
          : trimmedLine;
        
        return (
          <div key={index} className="flex gap-2 mb-1">
            <span className="text-blue-300 flex-shrink-0 inline-block w-4 text-center mt-5">•</span>
            <span className="flex-1">{cleanLine}</span>
          </div>
        );
      })}
    </div>
  );
}