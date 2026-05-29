"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDailyReport = exports.getWeeklyConnectivityReport = exports.getHouseholdVisualization = exports.getButtonPressedReport = exports.getConnectivityReport = exports.getViewership = exports.getLiveMonitoring = exports.getAlertsByDevice = exports.getAlerts = exports.getEventsByType = exports.getEvents = void 0;
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
const getLiveMonitoring = async (req, res) => {
    try {
        const filters = {
            device_id: req.query.device_id?.toString(),
            hhid: req.query.hhid?.toString(),
            page: req.query.page ? parseInt(req.query.page, 10) : 1,
            limit: req.query.limit ? parseInt(req.query.limit, 10) : 25,
        };
        const data = await service.getLiveMonitoring(filters);
        (0, response_1.sendSuccess)(res, data, "Live monitoring data retrieved");
    }
    catch (e) {
        console.error("getLiveMonitoring error:", e);
        (0, response_1.sendSuccess)(res, { data: [], pagination: { page: 1, limit: 25, total: 0, pages: 0 } }, "Error retrieving live monitoring data");
    }
};
exports.getLiveMonitoring = getLiveMonitoring;
const getViewership = async (req, res) => {
    try {
        const filters = {
            device_id: req.query.device_id?.toString(),
            hhid: req.query.hhid?.toString(),
            date: req.query.date?.toString(),
            status: req.query.status?.toString(),
            page: req.query.page ? parseInt(req.query.page, 10) : 1,
            limit: req.query.limit ? parseInt(req.query.limit, 10) : 25,
        };
        const data = await service.getViewership(filters);
        (0, response_1.sendSuccess)(res, data, "Viewership data retrieved");
    }
    catch (e) {
        console.error("getViewership error:", e);
        (0, response_1.sendSuccess)(res, { data: [], pagination: { page: 1, limit: 25, total: 0, pages: 0 } }, "Error retrieving viewership data");
    }
};
exports.getViewership = getViewership;
const getConnectivityReport = async (req, res) => {
    try {
        const filters = {
            device_id: req.query.device_id?.toString(),
            hhid: req.query.hhid?.toString(),
            date: req.query.date?.toString(),
            status: req.query.status?.toString(),
            page: req.query.page ? parseInt(req.query.page, 10) : 1,
            limit: req.query.limit ? parseInt(req.query.limit, 10) : 25,
        };
        const data = await service.getConnectivityReport(filters);
        (0, response_1.sendSuccess)(res, data, "Connectivity report retrieved");
    }
    catch (e) {
        console.error("getConnectivityReport error:", e);
        (0, response_1.sendSuccess)(res, { data: [], pagination: { page: 1, limit: 25, total: 0, pages: 0 } }, "Error");
    }
};
exports.getConnectivityReport = getConnectivityReport;
const getButtonPressedReport = async (req, res) => {
    try {
        const filters = {
            device_id: req.query.device_id?.toString(),
            hhid: req.query.hhid?.toString(),
            date: req.query.date?.toString(),
            status: req.query.status?.toString(),
            page: req.query.page ? parseInt(req.query.page, 10) : 1,
            limit: req.query.limit ? parseInt(req.query.limit, 10) : 25,
        };
        const data = await service.getButtonPressedReport(filters);
        (0, response_1.sendSuccess)(res, data, "Button pressed report retrieved");
    }
    catch (e) {
        console.error("getButtonPressedReport error:", e);
        (0, response_1.sendSuccess)(res, { data: [], pagination: { page: 1, limit: 25, total: 0, pages: 0 } }, "Error");
    }
};
exports.getButtonPressedReport = getButtonPressedReport;
const getHouseholdVisualization = async (req, res) => {
    try {
        const filters = {
            device_id: req.query.device_id?.toString(),
            hhid: req.query.hhid?.toString(),
            page: req.query.page ? parseInt(req.query.page, 10) : 1,
            limit: req.query.limit ? parseInt(req.query.limit, 10) : 500,
        };
        const data = await service.getHouseholdVisualization(filters);
        (0, response_1.sendSuccess)(res, data, "Household visualization data retrieved");
    }
    catch (e) {
        console.error("getHouseholdVisualization error:", e);
        (0, response_1.sendSuccess)(res, { data: [], pagination: { page: 1, limit: 500, total: 0, pages: 0 } }, "Error retrieving household visualization data");
    }
};
exports.getHouseholdVisualization = getHouseholdVisualization;
const getWeeklyConnectivityReport = async (req, res) => {
    try {
        const filters = {
            device_id: req.query.device_id?.toString(),
            hhid: req.query.hhid?.toString(),
            week_start: req.query.week_start?.toString(),
            status: req.query.status?.toString(),
            page: req.query.page ? parseInt(req.query.page, 10) : 1,
            limit: req.query.limit ? parseInt(req.query.limit, 10) : 25,
        };
        const data = await service.getWeeklyConnectivityReport(filters);
        (0, response_1.sendSuccess)(res, data, "Weekly connectivity report retrieved");
    }
    catch (e) {
        console.error("getWeeklyConnectivityReport error:", e);
        (0, response_1.sendSuccess)(res, { data: [], stats: { total_meters: 0, fully_connected: 0, partially_connected: 0, not_connected: 0, avg_connectivity_rate: 0 }, pagination: { page: 1, limit: 25, total: 0, pages: 0 } }, "Error retrieving weekly connectivity report");
    }
};
exports.getWeeklyConnectivityReport = getWeeklyConnectivityReport;
const getDailyReport = async (req, res) => {
    try {
        const filters = {
            device_id: req.query.device_id?.toString(),
            hhid: req.query.hhid?.toString(),
            date: req.query.date?.toString(),
            page: req.query.page ? parseInt(req.query.page, 10) : 1,
            limit: req.query.limit ? parseInt(req.query.limit, 10) : 25,
        };
        const data = await service.getDailyReport(filters);
        (0, response_1.sendSuccess)(res, data, "Daily report retrieved");
    }
    catch (e) {
        console.error("getDailyReport error:", e);
        (0, response_1.sendSuccess)(res, { data: [], stats: { total: 0, connectivity: 0, viewership: 0, member_dec: 0 }, pagination: { page: 1, limit: 25, total: 0, pages: 0 } }, "Error retrieving daily report");
    }
};
exports.getDailyReport = getDailyReport;
//# sourceMappingURL=events.controller.js.map