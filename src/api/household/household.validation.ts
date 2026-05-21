import Joi from "joi";

export const listHouseholdsSchema = Joi.object({
  search: Joi.string().optional(),
  assigned: Joi.string().valid("true", "false").optional(),
  groupName: Joi.string().optional(),
  contactEmail: Joi.string().email().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

export const updateContactSchema = Joi.object({
  contactEmail: Joi.string().email().required(),
});

export const uploadMembersSchema = Joi.object({
  householdId: Joi.string().uuid().required(),
});

export const assignMembersManuallySchema = Joi.object({
  hhid: Joi.string().required(),
  contactEmail: Joi.string().email().required(),
  members: Joi.array()
    .items(
      Joi.object({
        memberCode: Joi.string().max(10).required(),
        age: Joi.number().integer().min(0).max(120).required(),
        gender: Joi.string().valid("Male", "Female", "Other").required(),
        dob: Joi.string().isoDate().optional(),
      })
    )
    .min(1)
    .required(),
});

export const preregisteredEmailsSchema = Joi.object({
  search: Joi.string().optional().allow(""),
});