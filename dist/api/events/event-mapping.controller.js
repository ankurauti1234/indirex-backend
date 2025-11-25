"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEventMapping = exports.updateEventMapping = exports.createEventMapping = exports.getEventMapping = exports.getEventMappings = void 0;
const response_1 = require("../../utils/response");
const event_mapping_service_1 = require("../../services/events/event-mapping.service");
const service = new event_mapping_service_1.EventMappingService();
const getEventMappings = async (_req, res) => {
    const mappings = await service.getAll();
    (0, response_1.sendSuccess)(res, mappings, "Event mappings retrieved");
};
exports.getEventMappings = getEventMappings;
const getEventMapping = async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const mapping = await service.getById(id);
    (0, response_1.sendSuccess)(res, mapping);
};
exports.getEventMapping = getEventMapping;
const createEventMapping = async (req, res) => {
    const dto = req.body;
    const mapping = await service.create(dto);
    (0, response_1.sendSuccess)(res, mapping, "Event mapping created", 201);
};
exports.createEventMapping = createEventMapping;
const updateEventMapping = async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const dto = req.body;
    const mapping = await service.update(id, dto);
    (0, response_1.sendSuccess)(res, mapping, "Event mapping updated");
};
exports.updateEventMapping = updateEventMapping;
const deleteEventMapping = async (req, res) => {
    const id = parseInt(req.params.id, 10);
    await service.delete(id);
    (0, response_1.sendSuccess)(res, null, "Event mapping deleted", 204);
};
exports.deleteEventMapping = deleteEventMapping;
