import * as React from "react";

import { FeatureToggle } from "./FeatureToggle";

type SwitchProps = React.ComponentPropsWithoutRef<typeof FeatureToggle>;

const Switch = React.forwardRef<
  React.ElementRef<typeof FeatureToggle>,
  SwitchProps
>((props, ref) => {
  return <FeatureToggle ref={ref} {...props} />;
});

Switch.displayName = "Switch";

export { Switch };
