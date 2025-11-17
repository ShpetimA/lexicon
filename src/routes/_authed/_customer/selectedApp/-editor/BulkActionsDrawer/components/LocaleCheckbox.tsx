import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { ComponentProps } from "react";

type LocaleCheckboxProps = {
  labelProps: ComponentProps<typeof Label>;
  checkboxProps: ComponentProps<typeof Checkbox>;
};

const LocaleCheckbox = ({ labelProps, checkboxProps }: LocaleCheckboxProps) => {
  return (
    <div className="flex items-center gap-1 pl-2 border hover:bg-accent/50 cursor-pointer">
      <Checkbox {...checkboxProps} />
      <Label className="flex-1 cursor-pointer h-full p-4" {...labelProps} />
    </div>
  );
};

export default LocaleCheckbox;
