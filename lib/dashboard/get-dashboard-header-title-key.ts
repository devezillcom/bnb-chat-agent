const LIST_SECTION_TITLE_KEYS: Record<string, string> = {
  agents: "nav.agents",
  connections: "nav.connections",
  "knowledge-base": "nav.knowledgeBase",
  skills: "nav.skills",
  tools: "nav.tools",
};

const CREATE_TITLE_KEYS: Record<string, string> = {
  agents: "header.createAgent",
  skills: "header.createSkill",
  tools: "header.createTool",
};

const EDIT_TITLE_KEYS: Record<string, string> = {
  agents: "header.editAgent",
  skills: "header.editSkill",
  tools: "header.editTool",
};

const DETAIL_TITLE_KEYS: Record<string, string> = {
  agents: "header.agentDetail",
  connections: "header.connectionDetail",
  "knowledge-base": "header.knowledgeBaseDetail",
};

function getWorkspaceRouteSegments(pathname: string) {
  const segments = pathname.replace(/\/$/, "").split("/").filter(Boolean);

  if (segments.length < 2 || segments[0] !== "w") {
    return null;
  }

  return segments.slice(2);
}

export function getDashboardHeaderTitleKey(pathname: string): string {
  const rest = getWorkspaceRouteSegments(pathname);

  if (!rest || rest.length === 0) {
    return "appName";
  }

  const section = rest[0]!;

  if (section === "settings") {
    if (rest[1] === "profile") {
      return "accountMenu.profile";
    }

    return "nav.workspaceSettings";
  }

  if (rest.length === 1 && section in LIST_SECTION_TITLE_KEYS) {
    return LIST_SECTION_TITLE_KEYS[section]!;
  }

  if (rest.length === 2 && rest[1] === "new" && section in CREATE_TITLE_KEYS) {
    return CREATE_TITLE_KEYS[section]!;
  }

  if (rest.length === 3 && rest[2] === "edit" && section in EDIT_TITLE_KEYS) {
    return EDIT_TITLE_KEYS[section]!;
  }

  if (rest.length === 3 && rest[2] === "chat" && section === "agents") {
    return "header.chat";
  }

  if (
    section === "agents" &&
    rest.length === 3 &&
    ["instructions", "skills", "tools", "knowledge", "connections"].includes(rest[2]!)
  ) {
    return "header.agentDetail";
  }

  if (section === "connections" && rest[1] === "connect" && rest[2] === "facebook") {
    if (rest[3] === "select-page") {
      return "header.selectFacebookPage";
    }

    return "header.connectFacebook";
  }

  if (rest.length === 2 && section in DETAIL_TITLE_KEYS) {
    return DETAIL_TITLE_KEYS[section]!;
  }

  if (section in LIST_SECTION_TITLE_KEYS) {
    return LIST_SECTION_TITLE_KEYS[section]!;
  }

  return "appName";
}
