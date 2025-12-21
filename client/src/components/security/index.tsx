// Secure React components with XSS protection
import React from "react";
import DOMPurify from "dompurify";
import { log } from "@/utils/logger";

// Secure HTML component that sanitizes content
interface SecureHTMLProps {
  html: string;
  className?: string;
  tag?: "div" | "span" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export const SecureHTML: React.FC<SecureHTMLProps> = ({
  html,
  className,
  tag: Tag = "div",
}) => {
  const sanitizedHTML = React.useMemo(() => {
    try {
      return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          "p",
          "br",
          "strong",
          "em",
          "ul",
          "ol",
          "li",
          "a",
          "span",
        ],
        ALLOWED_ATTR: ["href", "class", "id", "target"],
        ALLOW_DATA_ATTR: false,
      });
    } catch (error) {
      log.error("Failed to sanitize HTML", { html, error: error as Error });
      return "";
    }
  }, [html]);

  return (
    <Tag
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
};

// Secure input component with validation
interface SecureInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  validateOnChange?: boolean;
  sanitizeInput?: boolean;
  validationRegex?: RegExp;
  errorMessage?: string;
  onValidationChange?: (isValid: boolean, value: string) => void;
}

export const SecureInput: React.FC<SecureInputProps> = ({
  validateOnChange = true,
  sanitizeInput = true,
  validationRegex,
  errorMessage,
  onValidationChange,
  onChange,
  value,
  ...props
}) => {
  const [internalValue, setInternalValue] = React.useState(value || "");
  const [isValid, setIsValid] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    setInternalValue(value || "");
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    // Sanitize input if enabled
    if (sanitizeInput) {
      newValue = newValue.replace(/[<>]/g, "");
    }

    setInternalValue(newValue);

    // Validate input if enabled
    if (validateOnChange) {
      let valid = true;
      let errorMsg = "";

      if (validationRegex && !validationRegex.test(newValue)) {
        valid = false;
        errorMsg = errorMessage || "Invalid input format";
      }

      setIsValid(valid);
      setError(errorMsg);
      onValidationChange?.(valid, newValue);
    }

    // Call original onChange with sanitized value
    if (onChange) {
      e.target.value = newValue;
      onChange(e);
    }
  };

  return (
    <div className="secure-input-container">
      <input
        {...props}
        value={internalValue}
        onChange={handleChange}
        className={`${props.className || ""} ${!isValid ? "invalid" : ""}`}
        aria-invalid={!isValid}
        aria-describedby={error ? `${props.id}-error` : undefined}
      />
      {!isValid && error && (
        <span id={`${props.id}-error`} className="error-message" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

// Secure form component with CSRF protection
interface SecureFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  csrfToken?: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export const SecureForm: React.FC<SecureFormProps> = ({
  csrfToken,
  onSubmit,
  children,
  ...props
}) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Add CSRF token to form data if not already present
    if (csrfToken) {
      const form = e.currentTarget;
      const csrfInput = form.querySelector(
        'input[name="csrf_token"]',
      ) as HTMLInputElement;

      if (!csrfInput) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = "csrf_token";
        input.value = csrfToken;
        form.appendChild(input);
      } else {
        csrfInput.value = csrfToken;
      }
    }

    onSubmit(e);
  };

  return (
    <form {...props} onSubmit={handleSubmit}>
      {csrfToken && (
        <input type="hidden" name="csrf_token" value={csrfToken} />
      )}
      {children}
    </form>
  );
};

// Secure link component that validates URLs
interface SecureLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  validateUrl?: boolean;
  allowExternal?: boolean;
}

export const SecureLink: React.FC<SecureLinkProps> = ({
  validateUrl = true,
  allowExternal = false,
  href,
  onClick,
  children,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (validateUrl && href) {
      try {
        const url = new URL(href, window.location.origin);

        // Check if URL is HTTPS in production
        if (
          process.env.NODE_ENV === "production" &&
          url.protocol !== "https:"
        ) {
          log.warn("Insecure link clicked", { href, protocol: url.protocol });
          e.preventDefault();
          return;
        }

        // Check if external links are allowed
        if (!allowExternal && url.origin !== window.location.origin) {
          log.warn("External link blocked", { href, origin: url.origin });
          e.preventDefault();
          return;
        }
      } catch (error) {
        log.error("Invalid URL clicked", { href, error: error as Error });
        e.preventDefault();
        return;
      }
    }

    onClick?.(e);
  };

  return (
    <a href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  );
};

// Secure image component with validation
interface SecureImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  validateSrc?: boolean;
  fallbackSrc?: string;
}

export const SecureImage: React.FC<SecureImageProps> = ({
  validateSrc = true,
  fallbackSrc,
  src,
  onError,
  ...props
}) => {
  const [imageSrc, setImageSrc] = React.useState(src);
  const [isValid, setIsValid] = React.useState(true);

  React.useEffect(() => {
    setImageSrc(src);
    setIsValid(true);
  }, [src]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    log.warn("Image failed to load", { src, error: "Image load error" });

    if (fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
    } else {
      setIsValid(false);
    }

    onError?.(e);
  };

  if (!isValid) {
    return (
      <div className="image-error" aria-label="Image failed to load">
        Image unavailable
      </div>
    );
  }

  return (
    <img
      {...props}
      src={imageSrc}
      onError={handleError}
      loading="lazy"
      referrerPolicy="no-referrer"
      alt={props.alt || "Image"}
    />
  );
};

export default {
  SecureHTML,
  SecureInput,
  SecureForm,
  SecureLink,
  SecureImage,
};
