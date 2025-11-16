import { cn } from "@/lib/utils";
import React from "react";

const Form = ({
  onSubmit,
  children,
  className,
}: {
  onSubmit: () => void;
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className={cn("space-y-4", className)}
    >
      {children}
    </form>
  );
};

export default Form;
