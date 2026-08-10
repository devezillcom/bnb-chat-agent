import type { FocusEventHandler } from "react";

export type SuggestionMenuItem = {
  id: string | number;
  name: string;
  description?: string;
};

export type RichInputVariant = "input" | "textarea";

export type RichInputFieldElement = HTMLInputElement | HTMLTextAreaElement;

export type RichInputProps = {
  id?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  containerClassName?: string;
  disabled?: boolean;
  variant?: RichInputVariant;
  onSubmit?: (value: string) => void;
  clearOnSubmit?: boolean;
  textSuggestions?: string[];
  menuItems?: SuggestionMenuItem[];
  menuTrigger?: string;
  name?: string;
  onBlur?: FocusEventHandler<RichInputFieldElement>;
};
