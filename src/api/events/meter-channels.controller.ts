import { Request, Response } from "express";
import { sendSuccess } from "../../utils/response";
import { MeterChannelService } from "../../services/events/meter-channel.service";

const service = new MeterChannelService();

const parseQuery = (query: any) => ({
  device_id: query.device_id?.toString().trim() || undefined, // keep undefined when empty
  status: query.status?.toString(),
   start_time: query.start_time ? parseInt(query.start_time, 10) : undefined,
  end_time: query.end_time ? parseInt(query.end_time, 10) : undefined,
  page: query.page ? parseInt(query.page, 10) : undefined,
  limit: query.limit ? parseInt(query.limit, 10) : undefined,
});

export const getMeterChannels = async (req: Request, res: Response) => {
  try {
    const filters = parseQuery(req.query);
    const data = await service.getMeterChannels(filters);
    sendSuccess(
      res,
      data,
      data.channels.length ? "Meter channels retrieved" : "No channels found"
    );
  } catch (e: any) {
    console.error("getMeterChannels error:", e);
    sendSuccess(
      res,
      { channels: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } },
      "Error"
    );
  }
};