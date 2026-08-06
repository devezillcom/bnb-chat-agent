"use client";

import {
  BellIcon,
  CreditCardIcon,
  PlugIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SETTINGS_ITEMS = [
  { label: "Profile", icon: UserIcon },
  { label: "Notifications", icon: BellIcon },
  { label: "Billing", icon: CreditCardIcon },
  { label: "Integrations", icon: PlugIcon },
] as const;

export function SettingsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Settings"
            className="size-8"
          />
        }
      >
        <SettingsIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Settings</DropdownMenuLabel>
          {SETTINGS_ITEMS.map(({ label, icon: Icon }) => (
            <DropdownMenuItem key={label}>
              <Icon className="size-4" />
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
