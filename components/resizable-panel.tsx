'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

interface ResizablePanelProps {
  children: ReactNode;
  direction: 'horizontal' | 'vertical';
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  storageKey?: string;
}

export default function ResizablePanel({
  children,
  direction,
  defaultSize = 50,
  minSize = 20,
  maxSize = 80,
  storageKey,
}: ResizablePanelProps) {
  const [size, setSize] = useState<number>(() => {
    if (storageKey && typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      return stored ? parseFloat(stored) : defaultSize;
    }
    return defaultSize;
  });
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, size.toString());
    }
  }, [size, storageKey]);

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!panelRef.current?.parentElement) return;

      const parentRect = panelRef.current.parentElement.getBoundingClientRect();
      let newSize: number;

      if (direction === 'horizontal') {
        const relativeX = e.clientX - parentRect.left;
        newSize = (relativeX / parentRect.width) * 100;
      } else {
        const relativeY = e.clientY - parentRect.top;
        newSize = (relativeY / parentRect.height) * 100;
      }

      newSize = Math.max(minSize, Math.min(maxSize, newSize));
      setSize(newSize);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, direction, minSize, maxSize]);

  const style = direction === 'horizontal' ? { width: `${size}%` } : { height: `${size}%` };

  return (
    <>
      <div ref={panelRef} style={style} className="relative">
        {children}
      </div>
      <div
        onMouseDown={handleMouseDown}
        className={`
          ${direction === 'horizontal' ? 'w-1 cursor-col-resize hover:bg-blue-500' : 'h-1 cursor-row-resize hover:bg-blue-500'}
          bg-gray-800 transition-colors z-10
          ${isResizing ? 'bg-blue-500' : ''}
        `}
      />
    </>
  );
}
