// src/services/alerts/alert.service.ts
import { AppDataSource } from "../../database/connection";
import { InactivityAlert } from "../../database/entities/InactivityAlert";
import { AlertEmailRecipient } from "../../database/entities/AlertEmailRecipient";
import { AlertSettings } from "../../database/entities/AlertSettings";
import { getOrCreateSettings } from "./alert.engine";

// ─── Inactive Meters ─────────────────────────────────────────────

// inactivity_filter values: "lt_3d" | "lt_1w" | "lt_2w" | "lt_1m" | "gt_1m"
// These filter by how long ago lastEventAt was (inactivity duration)
export async function getInactiveMeters(options: {
  page: number;
  limit: number;
  device_id?: string;
  inactivity_filter?: string;
}): Promise<{
  data: InactivityAlert[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const repo = AppDataSource.getRepository(InactivityAlert);
  const qb = repo
    .createQueryBuilder("a")
    .where("a.isActive = :isActive", { isActive: true });

  if (options.device_id) {
    qb.andWhere("a.device_id ILIKE :did", {
      did: `%${options.device_id}%`,
    });
  }

  // Inactivity duration filter — based on how long ago lastEventAt was
  if (options.inactivity_filter) {
    const now = new Date();
    const cutoffs: Record<string, Date> = {
      lt_3d: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      lt_1w: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      lt_2w: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      lt_1m: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    };

    if (options.inactivity_filter === "lt_3d") {
      // Inactive for less than 3 days: lastEventAt is between 3 days ago and now
      qb.andWhere("a.lastEventAt >= :cutoff", { cutoff: cutoffs.lt_3d });
    } else if (options.inactivity_filter === "lt_1w") {
      // Inactive between 3 days and 1 week
      qb.andWhere("a.lastEventAt >= :cutoff AND a.lastEventAt < :prev", {
        cutoff: cutoffs.lt_1w,
        prev: cutoffs.lt_3d,
      });
    } else if (options.inactivity_filter === "lt_2w") {
      // Inactive between 1 week and 2 weeks
      qb.andWhere("a.lastEventAt >= :cutoff AND a.lastEventAt < :prev", {
        cutoff: cutoffs.lt_2w,
        prev: cutoffs.lt_1w,
      });
    } else if (options.inactivity_filter === "lt_1m") {
      // Inactive between 2 weeks and 1 month
      qb.andWhere("a.lastEventAt >= :cutoff AND a.lastEventAt < :prev", {
        cutoff: cutoffs.lt_1m,
        prev: cutoffs.lt_2w,
      });
    } else if (options.inactivity_filter === "gt_1m") {
      // Inactive for more than 1 month (or never seen)
      qb.andWhere("(a.lastEventAt < :cutoff OR a.lastEventAt IS NULL)", {
        cutoff: cutoffs.lt_1m,
      });
    }
  }

  // Sort by inactivity ascending = most recently inactive first (lastEventAt DESC)
  // Null lastEventAt (never seen) goes to the bottom
  qb.orderBy("a.lastEventAt", "DESC", "NULLS LAST");

  const total = await qb.getCount();
  const data = await qb
    .skip((options.page - 1) * options.limit)
    .take(options.limit)
    .getMany();

  return {
    data,
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: Math.ceil(total / options.limit),
    },
  };
}

export async function getInactiveCount(): Promise<number> {
  const repo = AppDataSource.getRepository(InactivityAlert);
  return repo.count({ where: { isActive: true } });
}

export async function getAllActiveAlerts(): Promise<InactivityAlert[]> {
  const repo = AppDataSource.getRepository(InactivityAlert);
  return repo.find({
    where: { isActive: true },
    order: { device_id: "ASC" },
  });
}

// ─── Email Recipients ────────────────────────────────────────────

export async function getRecipients(): Promise<AlertEmailRecipient[]> {
  const repo = AppDataSource.getRepository(AlertEmailRecipient);
  return repo.find({ order: { createdAt: "ASC" } });
}

export async function addRecipient(
  email: string,
  name?: string
): Promise<AlertEmailRecipient> {
  const repo = AppDataSource.getRepository(AlertEmailRecipient);

  // Check for duplicate
  const existing = await repo.findOne({ where: { email } });
  if (existing) {
    throw new Error(`Recipient "${email}" already exists`);
  }

  const recipient = repo.create({ email, name: name || null });
  return repo.save(recipient);
}

export async function removeRecipient(id: number): Promise<void> {
  const repo = AppDataSource.getRepository(AlertEmailRecipient);
  const recipient = await repo.findOne({ where: { id } });
  if (!recipient) {
    throw new Error("Recipient not found");
  }
  await repo.remove(recipient);
}

// ─── Settings ────────────────────────────────────────────────────

export async function getSettings(): Promise<AlertSettings> {
  return getOrCreateSettings();
}

export async function updateSettings(updates: {
  inactivityThresholdHours?: number;
  emailFrequencyHours?: number;
}): Promise<AlertSettings> {
  const settings = await getOrCreateSettings();
  const repo = AppDataSource.getRepository(AlertSettings);

  if (updates.inactivityThresholdHours !== undefined) {
    settings.inactivityThresholdHours = updates.inactivityThresholdHours;
  }
  if (updates.emailFrequencyHours !== undefined) {
    settings.emailFrequencyHours = updates.emailFrequencyHours;
  }

  return repo.save(settings);
}