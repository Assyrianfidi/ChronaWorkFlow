import * as React from "react";

import { cn } from "@/lib/utils";
import Input from "./Input";

interface InputWithIconProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

const InputWithIcon = React.forwardRef<HTMLInputElement, InputWithIconProps>(
  ({ className, icon, iconPosition = "left", type, ...props }, ref) => {
    if (!icon) {
      return <Input className={className} type={type} ref={ref} {...props} />;
    }

    return (
      <div className="relative">
        {iconPosition === "left" && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
            {icon}
          </div>
        )}
        <Input
          type={type}
          className={cn(iconPosition === "left" ? "pl-10" : "pr-10", className)}
          ref={ref}
          {...props}
        />
        {iconPosition === "right" && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
            {icon}
          </div>
        )}
      </div>
    );
  },
);

InputWithIcon.displayName = "InputWithIcon";

export { InputWithIcon };
