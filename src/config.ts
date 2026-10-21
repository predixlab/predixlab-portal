export const config = {
  siteUrl: "https://predixlab.com",
  dashboardUrl: "https://dashboard.predixlab.com",
  githubUrl: "https://github.com/predixlab",
  xUrl: "https://x.com/predixlab",
};

export const dashboardLink = (path = "/", source = "portal") => {
  const url = new URL(path, config.dashboardUrl);
  url.searchParams.set("utm_source", "predixlab.com");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", "research_workspace");
  url.searchParams.set("utm_content", source);
  return url.toString();
};