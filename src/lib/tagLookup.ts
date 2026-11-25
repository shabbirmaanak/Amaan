import { prisma } from "@/lib/db";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The QR code embeds the tag's UUID; the printed card also shows a 6-char short code for manual lookup. */
export function findTagByIdentifier(identifier: string) {
  const where = UUID_RE.test(identifier)
    ? { id: identifier }
    : { shortCode: identifier.toUpperCase() };

  return prisma.tag.findUnique({
    where,
    include: {
      person: { include: { backupContacts: { orderBy: { order: "asc" } }, guardian: true } },
      event: { include: { meetPoints: true } },
    },
  });
}
