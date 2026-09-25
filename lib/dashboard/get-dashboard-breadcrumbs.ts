export type DashboardBreadcrumbItem = {
  labelKey: string;
  href?: string;
};

const LIST_SECTION_TITLE_KEYS: Record<string, string> = {
  agents: "nav.agents",
  connections: "nav.connections",
};

const CREATE_TITLE_KEYS: Record<string, string> = {
  agents: "header.createAgent",
};

const EDIT_TITLE_KEYS: Record<string, string> = {
  agents: "header.editAgent",
};

const DETAIL_TITLE_KEYS: Record<string, string> = {
  agents: "header.agentDetail",
  connections: "header.connectionDetail",
};

const AGENT_TAB_TITLE_KEYS: Record<string, string> = {
  instructions: "agentDetail.nav.instructions",
  skills: "agentDetail.nav.skills",
  tools: "agentDetail.nav.tools",
  knowledge: "agentDetail.nav.knowledge",
};

function getWorkspaceRoute(pathname: string) {
  const segments = pathname.replace(/\/$/, "").split("/").filter(Boolean);

  if (segments.length < 2 || segments[0] !== "w") {
    return null;
  }

  const workspaceIndex = Number(segments[1]);

  if (!Number.isInteger(workspaceIndex) || workspaceIndex < 0) {
    return null;
  }

  return {
    workspaceIndex,
    rest: segments.slice(2),
  };
}

function homeCrumb(workspaceIndex: number): DashboardBreadcrumbItem {
  return {
    labelKey: "header.home",
    href: `/w/${workspaceIndex}`,
  };
}

function sectionCrumb(
  workspaceIndex: number,
  section: string,
): DashboardBreadcrumbItem | null {
  const labelKey = LIST_SECTION_TITLE_KEYS[section];

  if (!labelKey) {
    return null;
  }

  return {
    labelKey,
    href: `/w/${workspaceIndex}/${section}`,
  };
}

export function getDashboardBreadcrumbs(
  pathname: string,
): DashboardBreadcrumbItem[] {
  const route = getWorkspaceRoute(pathname);

  if (!route) {
    return [{ labelKey: "header.home" }];
  }

  const { workspaceIndex, rest } = route;
  const home = homeCrumb(workspaceIndex);

  if (rest.length === 0) {
    return [{ labelKey: home.labelKey }];
  }

  const section = rest[0]!;

  if (section === "settings") {
    if (rest[1] === "profile") {
      return [home, { labelKey: "accountMenu.profile" }];
    }

    return [home, { labelKey: "nav.workspaceSettings" }];
  }

  const listCrumb = sectionCrumb(workspaceIndex, section);

  if (!listCrumb) {
    return [{ labelKey: home.labelKey }];
  }

  if (rest.length === 1) {
    return [home, { labelKey: listCrumb.labelKey }];
  }

  if (rest[1] === "new" && section in CREATE_TITLE_KEYS) {
    return [home, listCrumb, { labelKey: CREATE_TITLE_KEYS[section]! }];
  }

  if (
    section === "connections" &&
    rest[1] === "connect" &&
    rest[2] === "facebook"
  ) {
    const connectCrumb: DashboardBreadcrumbItem = {
      labelKey: "header.connectFacebook",
      href: `/w/${workspaceIndex}/connections/connect/facebook`,
    };

    if (rest[3] === "select-page") {
      return [
        home,
        listCrumb,
        connectCrumb,
        { labelKey: "header.selectFacebookPage" },
      ];
    }

    return [home, listCrumb, { labelKey: connectCrumb.labelKey }];
  }

  if (rest.length === 3 && rest[2] === "edit" && section in EDIT_TITLE_KEYS) {
    return [home, listCrumb, { labelKey: EDIT_TITLE_KEYS[section]! }];
  }

  if (section === "agents" && rest.length === 3 && rest[2] === "chat") {
    return [home, listCrumb, { labelKey: "header.chat" }];
  }

  if (section === "agents" && rest.length === 3 && rest[2] in AGENT_TAB_TITLE_KEYS) {
    return [
      home,
      listCrumb,
      {
        labelKey: "header.agentDetail",
        href: `/w/${workspaceIndex}/agents/${rest[1]}`,
      },
      { labelKey: AGENT_TAB_TITLE_KEYS[rest[2]!]! },
    ];
  }

  if (rest.length === 2 && section in DETAIL_TITLE_KEYS) {
    return [home, listCrumb, { labelKey: DETAIL_TITLE_KEYS[section]! }];
  }

  return [home, { labelKey: listCrumb.labelKey }];
}
