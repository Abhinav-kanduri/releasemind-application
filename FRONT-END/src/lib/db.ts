import { PrismaClient } from "@prisma/client";
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const db = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export async function context() {
  let project = await db.project.findFirst({ include: { productSpace: true } });
  if (!project) {
    const space = await db.productSpace.create({ data: { name: "Commerce Cloud" } });
    project = await db.project.create({ data: { name: "Customer Support Assistant", key: "CSAB", productSpaceId: space.id }, include: { productSpace: true } });
  }
  return project;
}

export async function assertRelease(projectId: string, releaseId?: string | null) {
  if (!releaseId) return null;
  const release = await db.release.findFirst({ where: { id: releaseId, projectId, archivedAt: null } });
  if (!release) throw new Error("Release does not belong to the selected project");
  return release;
}

export function jsonList(value: string) { try { return JSON.parse(value); } catch { return []; } }
