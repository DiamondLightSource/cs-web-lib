export const isFullyQualifiedUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

export const buildUrl = (
  defaultBaseHost: string,
  ...args: (string | undefined)[]
) => {
  const baseHost =
    defaultBaseHost && defaultBaseHost?.endsWith("/")
      ? defaultBaseHost
      : `${defaultBaseHost ?? ""}/`;
  const path =
    args
      ?.filter(s => s != null && s !== "")
      .map(s => s?.replace(/\/+$/, "").replace(/^\/+/, ""))
      .join("/") ?? "";

  if (isFullyQualifiedUrl(path)) {
    const parsedUrl = new URL(path);
    return parsedUrl.toString();
  }

  if (isFullyQualifiedUrl(baseHost)) {
    const parsedUrl = new URL(path, baseHost);
    return parsedUrl.toString();
  }

  // Assume a local relative path
  return `${baseHost}${path}`;
};
