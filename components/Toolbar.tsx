'use client';

import { useRef } from 'react';
import { Upload, Type, Undo, Redo, Download, RotateCcw } from 'lucide-react';
import { CanvasState } from '@/types';

interface ToolbarProps {
  onImageUpload: (file: File) => void;
  onAddText: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onReset: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasImage: boolean;
}

export default function Toolbar({
  onImageUpload,
  onAddText,
  onUndo,
  onRedo,
  onExport,
  onReset,
  canUndo,
  canRedo,
  hasImage,
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'image/png') {
      onImageUpload(file);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="toolbar">
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".png"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-secondary flex items-center gap-2"
          title="Upload PNG Image"
        >
          <Upload size={16} />
          Upload Image
        </button>

        <button
          onClick={onAddText}
          className="btn btn-primary flex items-center gap-2"
          title="Add Text Layer"
        >
          <Type size={16} />
          Add Text
        </button>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo (Ctrl+Z)"
        >
          <Undo size={16} />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo (Ctrl+Y)"
        >
          <Redo size={16} />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        <button
          onClick={onReset}
          className="btn btn-secondary flex items-center gap-2"
          title="Reset Canvas"
        >
          <RotateCcw size={16} />
          Reset
        </button>

        <button
          onClick={onExport}
          disabled={!hasImage}
          className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Export as PNG"
        >
          <Download size={16} />
          Export
        </button>
      </div>
    </div>
  );
}






