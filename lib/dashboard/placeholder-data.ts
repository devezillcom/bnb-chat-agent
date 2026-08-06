export type Workspace = {
  id: string;
  name: string;
  slug: string;
  role: "owner" | "admin" | "member";
};

export type ChatItem = {
  id: string;
  title: string;
  icon: string;
  iconColor: string;
};

export type TeamProject = {
  id: string;
  name: string;
};

export type Assistant = {
  id: string;
  name: string;
  role: string;
  description: string;
  avatarColor: string;
  initials: string;
};

export type ToolChip = {
  id: string;
  label: string;
  color: string;
};

export const PLACEHOLDER_WORKSPACES: Workspace[] = [
  { id: "ws-1", name: "Acme Properties", slug: "acme-properties", role: "owner" },
  { id: "ws-2", name: "Sunset Rentals", slug: "sunset-rentals", role: "admin" },
  { id: "ws-3", name: "Coastal Stays", slug: "coastal-stays", role: "member" },
];

export const PLACEHOLDER_TEAM_PROJECTS: TeamProject[] = [
  { id: "tp-1", name: "Website Redesign" },
  { id: "tp-2", name: "Mobile App Launch" },
  { id: "tp-3", name: "Guest Onboarding" },
];

export const PLACEHOLDER_CHATS: ChatItem[] = [
  { id: "c-1", title: "Pricing strategy Q3", icon: "P", iconColor: "bg-rose-100 text-rose-600" },
  { id: "c-2", title: "Listing copy review", icon: "L", iconColor: "bg-sky-100 text-sky-600" },
  { id: "c-3", title: "Check-in automation", icon: "C", iconColor: "bg-emerald-100 text-emerald-600" },
  { id: "c-4", title: "Competitor analysis", icon: "A", iconColor: "bg-amber-100 text-amber-600" },
  { id: "c-5", title: "Weekly ops summary", icon: "W", iconColor: "bg-violet-100 text-violet-600" },
];

export const PLACEHOLDER_ASSISTANTS: Assistant[] = [
  {
    id: "a-1",
    name: "Patrick",
    role: "Listing Writer",
    description: "Craft compelling property descriptions and headlines.",
    avatarColor: "bg-orange-100 text-orange-700",
    initials: "P",
  },
  {
    id: "a-2",
    name: "Emily",
    role: "Guest Support",
    description: "Draft replies for guest messages and FAQs.",
    avatarColor: "bg-pink-100 text-pink-700",
    initials: "E",
  },
  {
    id: "a-3",
    name: "Marcus",
    role: "Pricing Analyst",
    description: "Analyze rates, seasonality, and competitor pricing.",
    avatarColor: "bg-blue-100 text-blue-700",
    initials: "M",
  },
  {
    id: "a-4",
    name: "Sofia",
    role: "Ops Planner",
    description: "Plan turnovers, maintenance, and vendor schedules.",
    avatarColor: "bg-teal-100 text-teal-700",
    initials: "S",
  },
  {
    id: "a-5",
    name: "Leo",
    role: "Marketing",
    description: "Create social posts and email campaigns for listings.",
    avatarColor: "bg-indigo-100 text-indigo-700",
    initials: "L",
  },
  {
    id: "a-6",
    name: "Nina",
    role: "Review Responder",
    description: "Write thoughtful responses to guest reviews.",
    avatarColor: "bg-lime-100 text-lime-700",
    initials: "N",
  },
];

export const PLACEHOLDER_TOOL_CHIPS: ToolChip[] = [
  { id: "t-1", label: "BNB CLI", color: "bg-neutral-900 text-white" },
  { id: "t-2", label: "GitHub", color: "bg-neutral-800 text-white" },
  { id: "t-3", label: "Calendar", color: "bg-blue-600 text-white" },
  { id: "t-4", label: "Docs", color: "bg-emerald-600 text-white" },
  { id: "t-5", label: "Sheets", color: "bg-green-700 text-white" },
];
