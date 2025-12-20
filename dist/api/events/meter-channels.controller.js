"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMeterChannels = void 0;
const response_1 = require("../../utils/response");
const meter_channel_service_1 = require("../../services/events/meter-channel.service");
const service = new meter_channel_service_1.MeterChannelService();
const parseQuery = (query) => ({
    device_id: query.device_id?.toString().trim() || undefined, // keep undefined when empty
    status: query.status?.toString(),
    start_time: query.start_time ? parseInt(query.start_time, 10) : undefined,
    end_time: query.end_time ? parseInt(query.end_time, 10) : undefined,
    page: query.page ? parseInt(query.page, 10) : undefined,
    limit: query.limit ? parseInt(query.limit, 10) : undefined,
});
const getMeterChannels = async (req, res) => {
    try {
        const filters = parseQuery(req.query);
        const data = await service.getMeterChannels(filters);
        (0, response_1.sendSuccess)(res, data, data.channels.length ? "Meter channels retrieved" : "No channels found");
    }
    catch (e) {
        console.error("getMeterChannels error:", e);
        (0, response_1.sendSuccess)(res, { channels: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }, "Error");
    }
};
exports.getMeterChannels = getMeterChannels;
//# sourceMappingURL=meter-channels.controller.js.map