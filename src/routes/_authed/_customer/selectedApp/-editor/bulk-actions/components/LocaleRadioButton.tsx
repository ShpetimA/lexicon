import { Label } from "@/components/ui/label";
import { RadioGroupItem } from "@/components/ui/radio-group";
import React, { ComponentProps } from "react";

type Props = {
  labelProps: ComponentProps<typeof Label>;
  radioGroupItemProps: ComponentProps<typeof RadioGroupItem>;
};

const LocaleRadioButton = ({ labelProps, radioGroupItemProps }: Props) => {
  return (
    <div className="flex pl-2 items-center gap-3 border hover:bg-accent/50 cursor-pointer">
      <RadioGroupItem {...radioGroupItemProps} />
      <Label
        className="flex-1 w-full cursor-pointer h-full p-4"
        {...labelProps}
      />
    </div>
  );
};

export default LocaleRadioButton;
