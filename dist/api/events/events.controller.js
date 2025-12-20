"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAlertsByDevice = exports.getAlerts = exports.getEventsByType = exports.getEvents = void 0;
const response_1 = require("../../utils/response");
const event_service_1 = require("../../services/events/event.service");
const service = new event_service_1.EventService();
const parseQuery = (query) => {
    return {
        device_id: query.device_id?.toString(),
        type: query.type,
        start_time: query.start_time,
        end_time: query.end_time,
        page: query.page ? parseInt(query.page, 10) : undefined,
        limit: query.limit ? parseInt(query.limit, 10) : undefined,
    };
};
const getEvents = async (req, res) => {
    try {
        const filters = parseQuery(req.query);
        const data = await service.getEvents(filters);
        (0, response_1.sendSuccess)(res, data, data.events.length ? "Events retrieved" : "No events found");
    }
    catch (e) {
        console.error("getEvents error:", e);
        (0, response_1.sendSuccess)(res, { events: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }, "Error");
    }
};
exports.getEvents = getEvents;
const getEventsByType = async (req, res) => {
    try {
        const type = parseInt(req.params.type, 10);
        if (isNaN(type))
            throw new Error("Invalid type");
        const filters = parseQuery(req.query);
        const data = await service.getEventsByType(type, filters);
        (0, response_1.sendSuccess)(res, data, "Events by type");
    }
    catch (e) {
        (0, response_1.sendSuccess)(res, { events: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }, "No events");
    }
};
exports.getEventsByType = getEventsByType;
const getAlerts = async (req, res) => {
    try {
        const filters = parseQuery(req.query);
        const data = await service.getAlerts(filters);
        (0, response_1.sendSuccess)(res, data, "Alerts");
    }
    catch (e) {
        (0, response_1.sendSuccess)(res, { events: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }, "No alerts");
    }
};
exports.getAlerts = getAlerts;
const getAlertsByDevice = async (req, res) => {
    try {
        const device_id = req.params.device_id;
        const filters = parseQuery(req.query);
        const data = await service.getAlertsByDevice(device_id, filters);
        (0, response_1.sendSuccess)(res, data, "Alerts by device");
    }
    catch (e) {
        (0, response_1.sendSuccess)(res, { events: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }, "No alerts");
    }
};
exports.getAlertsByDevice = getAlertsByDevice;
//# sourceMappingURL=events.controller.js.map