import React from 'react';
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
// @ts-ignore
import { Button } from '../components/ui/button.js.js';
import { Upload, X, FileText, Loader2 } from "lucide-react";
// @ts-ignore
import { cn } from '../lib/utils.js.js';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: Record<string, string[]>;
  disabled?: boolean;
  className?: string;
}

export function FileUpload({
  onFilesSelected,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB
  accept = {
    "image/*": [".png", ".jpg", ".jpeg", ".gif"],
    "application/pdf": [".pdf"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
      ".docx",
    ],
    "application/vnd.ms-excel": [".xls"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
      ".xlsx",
    ],
  },
  disabled = false,
  className,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [rejectedFiles, setRejectedFiles] = useState<
    { file: File; error: string }[]
  >([]);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      setIsUploading(true);

      // Handle rejected files
      const newRejections = fileRejections.flatMap(({ file, errors }) =>
        errors.map((error: any) => ({
          file,
          error: error.message,
        })),
      );

      setRejectedFiles((prev) => [...prev, ...newRejections]);

      // Only keep files that are within size limit
      const validFiles = acceptedFiles.filter((file) => file.size <= maxSize);

      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }

      setIsUploading(false);
    },
    [maxSize, onFilesSelected],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize,
    disabled: disabled || isUploading,
  });

  const removeRejected = (index: number) => {
    setRejectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          isDragActive
            ? "border-primary bg-primary/10"
            : "border-muted-foreground/25",
          disabled && "opacity-50 cursor-not-allowed",
          className,
        )}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <div className="flex flex-col items-center justify-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Uploading files...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-sm text-muted-foreground">
              {isDragActive ? (
                <p>Drop the files here ...</p>
              ) : (
                <p>Drag & drop files here, or click to select files</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Max {maxFiles} files up to {maxSize / (1024 * 1024)}MB
            </p>
          </div>
        )}
      </div>

      {rejectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-destructive">
            Rejected Files
          </h4>
          <ul className="space-y-2">
            {rejectedFiles.map(({ file, error }, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between rounded border border-destructive/20 bg-destructive/5 p-2 text-sm"
              >
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-destructive" />
                  <span className="truncate">{file.name}</span>
                  <span className="text-destructive">({error})</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeRejected(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
