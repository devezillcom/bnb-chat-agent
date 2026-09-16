"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CheckIcon,
  ChevronDownIcon,
  LanguagesIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
  UserIcon,
} from "lucide-react";
import { useChangeLanguage, useT } from "next-i18next/client";
import { useTheme } from "next-themes";

import { useAuth } from "@/components/auth/auth-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n/constants";

const THEME_OPTIONS = [
  { value: "light", labelKey: "theme.light", icon: SunIcon },
  { value: "dark", labelKey: "theme.dark", icon: MoonIcon },
  { value: "system", labelKey: "theme.system", icon: MonitorIcon },
] as const;

type AccountMenuProps = {
  workspaceIndex: number;
};

function getUserInitials(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]!.charAt(0)}${parts[1]!.charAt(0)}`.toUpperCase();
  }

  return displayName.slice(0, 2).toUpperCase() || "?";
}

export function AccountMenu({ workspaceIndex }: AccountMenuProps) {
  const { t: tDashboard } = useT("dashboard");
  const { t: tCommon } = useT("common");
  const { user, signOut } = useAuth();
  const changeLanguage = useChangeLanguage();
  const { i18n } = useT("common");
  const { theme: activeTheme, setTheme } = useTheme();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const currentLanguage = i18n.language?.startsWith("vi") ? "vi" : "en";
  const displayName =
    user?.displayName?.trim() ||
    user?.email?.split("@")[0]?.trim() ||
    tDashboard("accountMenu.userFallback");
  const profileHref = `/w/${workspaceIndex}/settings/profile`;

  async function handleSignOut() {
    setSigningOut(true);

    try {
      await signOut();
    } finally {
      setSigningOut(false);
      setLogoutOpen(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              className="h-9 gap-2 px-2 font-normal"
              aria-label={tDashboard("accountMenu.openMenu")}
            />
          }
        >
          <Avatar size="sm">
            {user?.photoURL ? (
              <AvatarImage src={user.photoURL} alt={displayName} />
            ) : null}
            <AvatarFallback>{getUserInitials(displayName)}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[140px] truncate text-sm sm:inline">
            {displayName}
          </span>
          <ChevronDownIcon className="hidden size-4 text-muted-foreground sm:block" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          {user?.email ? (
            <>
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <p className="truncate text-sm font-medium">{displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
            </>
          ) : null}
          <DropdownMenuGroup>
            <DropdownMenuItem render={<Link href={profileHref} />}>
              <UserIcon className="size-4" />
              {tDashboard("accountMenu.profile")}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <LanguagesIcon className="size-4" />
                {tCommon("language.label")}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {SUPPORTED_LANGUAGES.map((value) => (
                  <DropdownMenuItem
                    key={value}
                    onClick={() => {
                      void changeLanguage(value);
                    }}
                  >
                    {tCommon(`language.${value}`)}
                    {currentLanguage === value ? (
                      <CheckIcon className="ml-auto size-4 text-muted-foreground" />
                    ) : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <SunIcon className="size-4" />
                {tCommon("theme.label")}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {THEME_OPTIONS.map(({ value, labelKey, icon: Icon }) => (
                  <DropdownMenuItem
                    key={value}
                    onClick={() => setTheme(value)}
                  >
                    <Icon className="size-4" />
                    {tCommon(labelKey)}
                    {activeTheme === value ? (
                      <CheckIcon className="ml-auto size-4 text-muted-foreground" />
                    ) : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setLogoutOpen(true)}
          >
            <LogOutIcon className="size-4" />
            {tDashboard("logout.label")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tDashboard("logout.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tDashboard("logout.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={signingOut}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={signingOut}
              onClick={handleSignOut}
            >
              {tDashboard("logout.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
