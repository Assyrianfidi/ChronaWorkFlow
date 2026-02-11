/**
 * PresentationModeExit Component
 * Floating button to exit presentation mode
 */

import React from "react";
import { useView } from "@/contexts/ViewContext";
import { Button } from "@/components/ui/button";
import { Minimize2 } from "lucide-react";

export const PresentationModeExit: React.FC = () => {
  const { temporaryView, exitPresentationMode } = useView();

  if (temporaryView !== "presentation" && temporaryView !== "fullscreen") {
    return null;
  }

  return (
    <div className="presentation-exit">
      <Button
        variant="secondary"
        size="sm"
        onClick={exitPresentationMode}
        className="shadow-lg gap-2"
      >
        <Minimize2 className="h-4 w-4" />
        Exit Presentation
      </Button>
    </div>
  );
};

export default PresentationModeExit;
