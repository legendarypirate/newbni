"use strict";

/**
 * Sequelize entrypoint: `sequelize` instance + every registered model.
 *
 * Schema definitions:
 * - Events / trips / registration — `bni-event.model.js`, `business-trip.model.js`, `trip-registration.model.js`
 * - Everything else — wired in `init-models.js` (associations live there too).
 */

const Sequelize = require("sequelize");
const { createSequelize } = require("../config/db.config");
const initModels = require("./init-models");

const sequelize = createSequelize();
const m = initModels(sequelize);

module.exports = {
  sequelize,
  Sequelize,

  // Platform
  PlatformAccount: m.PlatformAccount,
  PlatformProfile: m.PlatformProfile,

  // Regions & chapters
  Region: m.Region,
  Chapter: m.Chapter,
  ChapterMembership: m.ChapterMembership,
  Curriculum: m.Curriculum,
  ChapterWeeklySchedule: m.ChapterWeeklySchedule,

  // Events (`bni_events`) — see `bni-event.model.js`
  BniEvent: m.BniEvent,

  // Trips (`business_trips`) — see `business-trip.model.js`
  BusinessTrip: m.BusinessTrip,

  // Investments (`investment_projects`) — see `investment-project.model.js`
  InvestmentProject: m.InvestmentProject,

  // Trip / event registration — see `trip-registration.model.js`
  TripRegistrationForm: m.TripRegistrationForm,
  TripFormQuestion: m.TripFormQuestion,
  TripFormQuestionOption: m.TripFormQuestionOption,
  TripFormResponse: m.TripFormResponse,
  TripFormResponseAnswer: m.TripFormResponseAnswer,
  TripParticipant: m.TripParticipant,
  TripPayment: m.TripPayment,

  // Busy weekly meetings & audit
  BusyMeetingGroup: m.BusyMeetingGroup,
  BusyWeeklyMeeting: m.BusyWeeklyMeeting,
  BusyMeetingRegistration: m.BusyMeetingRegistration,
  BusyMeetingRosterExport: m.BusyMeetingRosterExport,
  BusyAuditLog: m.BusyAuditLog,

  // Busy RBAC
  BusyRole: m.BusyRole,
  BusyPermission: m.BusyPermission,
  BusyRolePermission: m.BusyRolePermission,
  BusyUserRoleAssignment: m.BusyUserRoleAssignment,

  // Legacy / misc
  SiteSetting: m.SiteSetting,
  LegacyMeeting: m.LegacyMeeting,
  NewsArticle: m.NewsArticle,
  ContentTranslation: m.ContentTranslation,
  ContentLike: m.ContentLike,
  LegacyMember: m.LegacyMember,
  PaymentOrder: m.PaymentOrder,
};
