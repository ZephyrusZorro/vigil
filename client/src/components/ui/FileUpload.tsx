import React, { useRef, useState } from 'react';
import { UploadCloud, File, X, Check } from 'lucide-react';
import { formatFileSize } from '@/utils/format';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  maxSizeBytes?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  isLoading = false,
  maxSizeBytes = 50 * 1024 * 1024,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError(null);
    if (file.size > maxSizeBytes) {
      setError(`File size exceeds ${formatFileSize(maxSizeBytes)} limit`);
      return;
    }
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={e => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${
          dragOver
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={e => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center">
          <div className="p-3 bg-zinc-800/80 text-zinc-400 rounded-xl mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-zinc-200">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            PDF, PNG, JPG, DOCX up to 50MB
          </p>
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {selectedFile && !error && (
        <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <File className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span className="text-xs font-medium text-zinc-200 truncate">
              {selectedFile.name}
            </span>
            <span className="text-[10px] text-zinc-500 flex-shrink-0">
              ({formatFileSize(selectedFile.size)})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isLoading ? (
              <span className="text-xs text-indigo-400 animate-pulse">Uploading...</span>
            ) : (
              <Check className="w-4 h-4 text-emerald-400" />
            )}
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                setSelectedFile(null);
              }}
              className="p-1 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
