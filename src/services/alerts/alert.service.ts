// src/services/alerts/alert.service.ts
import { AppDataSource } from "../../database/connection";
import { InactivityAlert } from "../../database/entities/InactivityAlert";
import { AlertEmailRecipient } from "../../database/entities/AlertEmailRecipient";
import { AlertSettings } from "../../database/entities/AlertSettings";
import { getOrCreateSettings } from "./alert.engine";

// ─── Inactive Meters ─────────────────────────────────────────────

export async function getInactiveMeters(options: {
  page: number;
  limit: number;
  device_id?: string;
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

  qb.orderBy("a.device_id", "ASC");

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
