import React from 'react';
import { useState, useRef, KeyboardEvent, useEffect } from "react";
import { X, Plus } from "lucide-react";
// @ts-ignore
import { cn } from '../lib/utils.js.js';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function TagInput({
  tags = [],
  onChange,
  maxTags = 5,
  placeholder = "Add a tag...",
  className,
  disabled = false,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      // Remove last tag on backspace when input is empty
      removeTag(tags.length - 1);
    }
  };

  const addTag = () => {
    const newTag = inputValue.trim();

    if (newTag && !tags.includes(newTag) && tags.length < maxTags) {
      onChange([...tags, newTag]);
      setInputValue("");
    }
  };

  const removeTag = (index: number) => {
    const newTags = [...tags];
    newTags.splice(index, 1);
    onChange(newTags);
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addTag();
    }
    setIsFocused(false);
  };

  // Focus the input when the component mounts or when tags change
  useEffect(() => {
    if (inputRef.current && tags.length < maxTags) {
      inputRef.current.focus();
    }
  }, [tags, maxTags]);

  const isMaxTags = tags.length >= maxTags;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
        isFocused && "ring-2 ring-ring ring-offset-2",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag, index) => (
        <div
          key={`${tag}-${index}`}
          className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
        >
          <span>{tag}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(index);
            }}
            className="ml-1 rounded-full p-0.5 hover:bg-primary/20"
            disabled={disabled}
            aria-label={`Remove tag ${tag}`}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      {!isMaxTags && (
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          disabled={disabled}
          maxLength={20}
        />
      )}

      {isMaxTags && (
        <span className="text-xs text-muted-foreground">
          Max {maxTags} tags reached
        </span>
      )}

      {!disabled && !isMaxTags && inputValue && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            addTag();
          }}
          className="rounded-full p-1 text-primary hover:bg-primary/10"
          aria-label="Add tag"
        >
          <Plus className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
