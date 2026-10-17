import React, { useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackIcon?: React.ReactNode;
  containerClassName?: string;
}

export function ImageWithFallback({ 
  src, 
  alt, 
  className, 
  containerClassName,
  fallbackIcon,
  ...props 
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);
  
  if (!src || error) {
    return (
      <div className={cn("flex items-center justify-center bg-slate-100 text-slate-400", containerClassName, className)}>
        {fallbackIcon || <ImageIcon className="h-5 w-5" />}
      </div>
    );
  }
  
  return (
    <img 
      src={src} 
      alt={alt || "Image"} 
      className={className} 
      onError={() => setError(true)} 
      loading="lazy"
      {...props} 
    />
  );
}
