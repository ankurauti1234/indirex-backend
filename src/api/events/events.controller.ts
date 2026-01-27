// src/api/events/event.controller.ts
import { Request, Response } from "express";
import { sendSuccess } from "../../utils/response";
import { EventService } from "../../services/events/event.service";
import { EventFilters } from "./events.types";

const service = new EventService();

const parseQuery = (query: any): EventFilters => {
  return {
    device_id: query.device_id?.toString(),
    type: query.type,
    start_time: query.start_time,
    end_time: query.end_time,
    page: query.page ? parseInt(query.page, 10) : undefined,
    limit: query.limit ? parseInt(query.limit, 10) : undefined,
  };
};

export const getEvents = async (req: Request, res: Response) => {
  try {
    const filters = parseQuery(req.query);
    const data = await service.getEvents(filters);
    sendSuccess(res, data, data.events.length ? "Events retrieved" : "No events found");
  } catch (e: any) {
    console.error("getEvents error:", e);
    sendSuccess(res, { events: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }, "Error");
  }
}; 

export const getEventsByType = async (req: Request, res: Response) => {
  try {
    const type = parseInt(req.params.type, 10);
    if (isNaN(type)) throw new Error("Invalid type");
    const filters = parseQuery(req.query);
    const data = await service.getEventsByType(type, filters);
    sendSuccess(res, data, "Events by type");
  } catch (e: any) {
    sendSuccess(res, { events: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }, "No events");
  }
};

export const getAlerts = async (req: Request, res: Response) => {
  try {
    const filters = parseQuery(req.query);
    const data = await service.getAlerts(filters);
    sendSuccess(res, data, "Alerts");
  } catch (e: any) {
    sendSuccess(res, { events: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }, "No alerts");
  }
};

export const getAlertsByDevice = async (req: Request, res: Response) => {
  try {
    const device_id = req.params.device_id;
    const filters = parseQuery(req.query);
    const data = await service.getAlertsByDevice(device_id, filters);
    sendSuccess(res, data, "Alerts by device");
  } catch (e: any) {
    sendSuccess(res, { events: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }, "No alerts");
  }
};

export const getLiveMonitoring = async (req: Request, res: Response) => {
  try {
    const filters = {
      device_id: req.query.device_id?.toString(),
      hhid: req.query.hhid?.toString(),
      date: req.query.date?.toString(),
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 25,
    };
    const data = await service.getLiveMonitoring(filters);
    sendSuccess(res, data, "Live monitoring data retrieved");
  } catch (e: any) {
    console.error("getLiveMonitoring error:", e);
    sendSuccess(res, { data: [], pagination: { page: 1, limit: 25, total: 0, pages: 0 } }, "Error retrieving live monitoring data");
  }
};

export const getViewership = async (req: Request, res: Response) => {
  try {
    const filters = {
      device_id: req.query.device_id?.toString(),
      hhid: req.query.hhid?.toString(),
      date: req.query.date?.toString(),
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 25,
    };
    const data = await service.getViewership(filters);
    sendSuccess(res, data, "Viewership data retrieved");
  } catch (e: any) {
    console.error("getViewership error:", e);
    sendSuccess(res, { data: [], pagination: { page: 1, limit: 25, total: 0, pages: 0 } }, "Error retrieving viewership data");
  }
};