import React, { useState, useRef } from "react";
import { UploadCloud, X, FileImage, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string;
  onChange?: (file: File | null) => void;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ value, onChange, className }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file: File) => {
    setError(null);
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setError("Only JPG, PNG, and WebP formats are supported.");
      return false;
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError("File size must not exceed 5MB.");
      return false;
    }
    return true;
  };

  const processFile = (file: File) => {
    if (!validateFile(file)) return;
    
    // Set preview and details
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setFileDetails({
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + " MB"
    });
    
    // Notify parent
    if (onChange) onChange(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setFileDetails(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    if (onChange) onChange(null);
  };

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleChange}
        className="hidden"
      />

      {error && (
        <div className="mb-2 flex items-center text-sm text-red-600 bg-red-50 p-2 rounded-md border border-red-100">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}

      {preview ? (
        <div className="relative rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
          <div className="flex items-center gap-4 p-4">
            <div className="h-20 w-20 shrink-0 rounded-md overflow-hidden bg-white border border-slate-200">
              <img src={preview} alt="Preview" className="h-full w-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {fileDetails?.name || "Existing Image"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {fileDetails?.size || "Size unknown"}
              </p>
            </div>
          </div>
          <div className="bg-slate-100 px-4 py-3 flex gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="text-sm font-medium text-red-600 hover:text-red-700 ml-auto flex items-center"
            >
              <X className="w-4 h-4 mr-1" /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer text-center",
            dragActive ? "border-blue-500 bg-blue-50/50" : "border-slate-300 bg-slate-50 hover:bg-slate-100"
          )}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-4">
            <UploadCloud className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">Drag & drop an image, or click to browse</h3>
          <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto">
            Supported formats: PNG, JPG, WebP. Maximum size: 5MB.
          </p>
        </div>
      )}
      
    </div>
  );
};
