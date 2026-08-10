"use client";

import { useCallback, useState } from "react";

type UseControllableStateParams = {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
};

export function useControllableState({
  value,
  defaultValue = "",
  onChange,
}: UseControllableStateParams) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const resolvedValue = isControlled ? value : internalValue;

  const setValue = useCallback(
    (nextValue: string) => {
      if (!isControlled) {
        setInternalValue(nextValue);
      }

      onChange?.(nextValue);
    },
    [isControlled, onChange],
  );

  return [resolvedValue, setValue] as const;
}
