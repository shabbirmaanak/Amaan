export type TagLike = {
  status: "ACTIVE" | "LOST" | "EXPIRED";
  expiresAt: Date;
};

/** A tag is expired once we're past its expiry time, regardless of its stored status. */
export function isTagExpired(tag: TagLike, now: Date = new Date()): boolean {
  return now.getTime() >= tag.expiresAt.getTime();
}

/** The status a reader should treat the tag as, folding in time-based expiry. */
export function effectiveTagStatus(
  tag: TagLike,
  now: Date = new Date()
): "ACTIVE" | "LOST" | "EXPIRED" {
  if (tag.status === "EXPIRED") return "EXPIRED";
  if (isTagExpired(tag, now)) return "EXPIRED";
  return tag.status;
}

/** Whether a tag may still be used for finder/volunteer scans. */
export function isTagUsable(tag: TagLike, now: Date = new Date()): boolean {
  return effectiveTagStatus(tag, now) !== "EXPIRED";
}
