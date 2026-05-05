"use strict";

/**
 * Sequelize models mirroring busybni prisma/schema.prisma (PostgreSQL @@map table names).
 * Attribute names are camelCase; columns use field: snake_case where DB differs.
 *
 * Domain models also live alongside: `bni-event.model.js`, `business-trip.model.js`,
 * `trip-registration.model.js` — imported here and re-exported via `models/index.js`.
 */

const defineBniEvent = require("./bni-event.model");
const defineBusinessTrip = require("./business-trip.model");
const defineTripRegistrationModels = require("./trip-registration.model");

function initModels(sequelize) {
  const Sequelize = sequelize.constructor;
  const { DataTypes } = Sequelize;

  const PlatformAccount = sequelize.define(
    "PlatformAccount",
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      passwordHash: { type: DataTypes.STRING(255), field: "password_hash", allowNull: true },
      passwordResetToken: { type: DataTypes.CHAR(64), field: "password_reset_token_hash", allowNull: true },
      passwordResetExpires: { type: DataTypes.DATE, field: "password_reset_expires_at", allowNull: true },
      googleSub: { type: DataTypes.STRING(64), field: "google_sub", allowNull: true, unique: true },
      role: {
        type: DataTypes.ENUM("visitor", "member", "director", "admin"),
        allowNull: false,
        defaultValue: "visitor",
      },
      status: {
        type: DataTypes.ENUM("active", "suspended", "deleted"),
        allowNull: false,
        defaultValue: "active",
      },
      emailVerifiedAt: { type: DataTypes.DATE, field: "email_verified_at", allowNull: true },
      lastLoginAt: { type: DataTypes.DATE, field: "last_login_at", allowNull: true },
      createdAt: { type: DataTypes.DATE, field: "created_at", allowNull: false },
      updatedAt: { type: DataTypes.DATE, field: "updated_at", allowNull: false },
    },
    { tableName: "bni_platform_accounts", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" },
  );

  const PlatformProfile = sequelize.define(
    "PlatformProfile",
    {
      accountId: { type: DataTypes.BIGINT, field: "account_id", primaryKey: true },
      displayName: { type: DataTypes.STRING(255), field: "display_name", allowNull: false, defaultValue: "" },
      bio: DataTypes.TEXT,
      photoUrl: { type: DataTypes.STRING(512), field: "photo_url", allowNull: true },
      companyName: { type: DataTypes.STRING(255), field: "company_name", allowNull: true },
      businessPhone: { type: DataTypes.STRING(64), field: "business_phone", allowNull: true },
      businessEmail: { type: DataTypes.STRING(255), field: "business_email", allowNull: true },
      website: { type: DataTypes.STRING(512), allowNull: true },
      addressLine: { type: DataTypes.STRING(512), field: "address_line", allowNull: true },
      businessJson: { type: DataTypes.JSONB, field: "business_json", allowNull: true },
      updatedAt: { type: DataTypes.DATE, field: "updated_at", allowNull: false },
    },
    { tableName: "bni_platform_profiles", timestamps: true, createdAt: false, updatedAt: "updated_at" },
  );

  const Region = sequelize.define(
    "Region",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(190), allowNull: false },
      slug: { type: DataTypes.STRING(190), allowNull: false, unique: true },
      sortOrder: { type: DataTypes.INTEGER, field: "sort_order", allowNull: false, defaultValue: 0 },
    },
    { tableName: "bni_regions", timestamps: true, updatedAt: false, createdAt: "created_at" },
  );

  const Chapter = sequelize.define(
    "Chapter",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      regionId: { type: DataTypes.INTEGER, field: "region_id", allowNull: false },
      name: { type: DataTypes.STRING(190), allowNull: false },
      slug: { type: DataTypes.STRING(190), allowNull: false },
      maxMembers: { type: DataTypes.INTEGER, field: "max_members", allowNull: false, defaultValue: 40 },
      timezone: { type: DataTypes.STRING(64), allowNull: false, defaultValue: "Asia/Ulaanbaatar" },
      createdAt: { type: DataTypes.DATE, field: "created_at", allowNull: false },
      updatedAt: { type: DataTypes.DATE, field: "updated_at", allowNull: false },
    },
    {
      tableName: "bni_chapters",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [{ unique: true, fields: ["region_id", "slug"], name: "bni_chapters_region_id_slug_key" }],
    },
  );

  const ChapterMembership = sequelize.define(
    "ChapterMembership",
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      accountId: { type: DataTypes.BIGINT, field: "account_id", allowNull: false },
      chapterId: { type: DataTypes.INTEGER, field: "chapter_id", allowNull: false },
      classificationId: { type: DataTypes.INTEGER, field: "classification_id", allowNull: true },
      joinDate: { type: DataTypes.DATEONLY, field: "join_date", allowNull: true },
      expiryDate: { type: DataTypes.DATEONLY, field: "expiry_date", allowNull: true },
      status: {
        type: DataTypes.ENUM("pending", "active", "expired", "transferred", "left"),
        allowNull: false,
        defaultValue: "pending",
      },
      notes: DataTypes.TEXT,
      createdAt: { type: DataTypes.DATE, field: "created_at", allowNull: false },
      updatedAt: { type: DataTypes.DATE, field: "updated_at", allowNull: false },
    },
    {
      tableName: "bni_chapter_memberships",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [{ unique: true, fields: ["account_id", "chapter_id"], name: "bni_chapter_memberships_account_chapter_key" }],
    },
  );

  const Curriculum = sequelize.define(
    "Curriculum",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      chapterId: { type: DataTypes.INTEGER, field: "chapter_id", allowNull: true },
      name: { type: DataTypes.STRING(190), allowNull: false },
      agendaJson: { type: DataTypes.JSONB, field: "agenda_json", allowNull: false },
      version: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 1 },
    },
    { tableName: "bni_curriculums", timestamps: true, updatedAt: false, createdAt: "created_at" },
  );

  const ChapterWeeklySchedule = sequelize.define(
    "ChapterWeeklySchedule",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      chapterId: { type: DataTypes.INTEGER, field: "chapter_id", allowNull: false },
      curriculumId: { type: DataTypes.INTEGER, field: "curriculum_id", allowNull: false },
      dayOfWeek: { type: DataTypes.SMALLINT, field: "day_of_week", allowNull: false },
      startTime: { type: DataTypes.TIME, field: "start_time", allowNull: false },
      endTime: { type: DataTypes.TIME, field: "end_time", allowNull: false },
      location: { type: DataTypes.STRING(512), allowNull: true },
      isOnline: { type: DataTypes.BOOLEAN, field: "is_online", allowNull: false, defaultValue: false },
      isActive: { type: DataTypes.BOOLEAN, field: "is_active", allowNull: false, defaultValue: true },
    },
    { tableName: "bni_chapter_weekly_schedules", timestamps: true, updatedAt: false, createdAt: "created_at" },
  );

  const BniEvent = defineBniEvent(sequelize, DataTypes);

  const SiteSetting = sequelize.define(
    "SiteSetting",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      settingName: { type: DataTypes.STRING(100), field: "setting_name", allowNull: false, unique: true },
      settingValue: { type: DataTypes.TEXT, field: "setting_value", allowNull: true },
      createdAt: { type: DataTypes.DATE, field: "created_at", allowNull: false },
      updatedAt: { type: DataTypes.DATE, field: "updated_at", allowNull: false },
    },
    { tableName: "site_settings", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" },
  );

  const LegacyMeeting = sequelize.define(
    "LegacyMeeting",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: DataTypes.STRING(255), allowNull: false },
      meetingDate: { type: DataTypes.DATEONLY, field: "meeting_date", allowNull: false },
      startTime: { type: DataTypes.TIME, field: "start_time", allowNull: false },
      endTime: { type: DataTypes.TIME, field: "end_time", allowNull: false },
      location: { type: DataTypes.STRING(255), allowNull: true },
      maxAttendees: { type: DataTypes.INTEGER, field: "max_attendees", allowNull: false, defaultValue: 0 },
      description: DataTypes.TEXT,
      status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: "active" },
      bannerImage: { type: DataTypes.STRING(512), field: "banner_image", allowNull: true },
      agendaJson: { type: DataTypes.TEXT, field: "agenda_json", allowNull: true },
      priceMnt: { type: DataTypes.DECIMAL(12, 2), field: "price_mnt", allowNull: true },
      advanceOrderMnt: { type: DataTypes.DECIMAL(12, 2), field: "advance_order_mnt", allowNull: true },
      createdAt: { type: DataTypes.DATE, field: "created_at", allowNull: false },
      updatedAt: { type: DataTypes.DATE, field: "updated_at", allowNull: false },
    },
    { tableName: "meetings", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" },
  );

  const BusinessTrip = defineBusinessTrip(sequelize, DataTypes);

  const NewsArticle = sequelize.define(
    "NewsArticle",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      category: DataTypes.INTEGER,
      type: DataTypes.INTEGER,
      createDate: { type: DataTypes.DATEONLY, field: "create_date", allowNull: true },
      title: { type: DataTypes.STRING(512), allowNull: false },
      slug: { type: DataTypes.STRING(512), allowNull: false, unique: true },
      excerpt: DataTypes.TEXT,
      content: DataTypes.TEXT,
      body: DataTypes.TEXT,
      image: { type: DataTypes.STRING(512), allowNull: true },
      images: { type: DataTypes.STRING(512), allowNull: true },
      authorId: { type: DataTypes.INTEGER, field: "author_id", allowNull: false },
      status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: "draft" },
      featured: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    { tableName: "news", timestamps: true, createdAt: "created_at", updatedAt: "updated_at", indexes: [{ fields: ["status"] }] },
  );

  const LegacyMember = sequelize.define(
    "LegacyMember",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(100), allowNull: false },
      position: { type: DataTypes.STRING(100), allowNull: true },
      company: { type: DataTypes.STRING(150), allowNull: true },
      industry: { type: DataTypes.STRING(100), allowNull: true },
      bio: DataTypes.TEXT,
      email: { type: DataTypes.STRING(100), allowNull: true },
      phone: { type: DataTypes.STRING(50), allowNull: true },
      website: { type: DataTypes.STRING(255), allowNull: true },
      linkedin: { type: DataTypes.STRING(255), allowNull: true },
      facebook: { type: DataTypes.STRING(255), allowNull: true },
      photo: { type: DataTypes.STRING(255), allowNull: true },
      featured: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: "active" },
      createdAt: { type: DataTypes.DATE, field: "created_at", allowNull: false },
      updatedAt: { type: DataTypes.DATE, field: "updated_at", allowNull: false },
    },
    { tableName: "members", timestamps: true, createdAt: "created_at", updatedAt: "updated_at", indexes: [{ fields: ["status"] }] },
  );

  const PaymentOrder = sequelize.define(
    "PaymentOrder",
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      orderRef: { type: DataTypes.STRING(64), field: "order_ref", allowNull: false, unique: true },
      targetType: { type: DataTypes.STRING(32), field: "target_type", allowNull: false },
      targetId: { type: DataTypes.BIGINT, field: "target_id", allowNull: false },
      fullPriceMnt: { type: DataTypes.DECIMAL(12, 2), field: "full_price_mnt", allowNull: true },
      advancePercent: { type: DataTypes.SMALLINT, field: "advance_percent", allowNull: false, defaultValue: 0 },
      amountMnt: { type: DataTypes.INTEGER, field: "amount_mnt", allowNull: false },
      qpayInvoiceId: { type: DataTypes.STRING(128), field: "qpay_invoice_id", allowNull: true },
      status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: "pending" },
      qpayInvoiceResponseJson: { type: DataTypes.TEXT, field: "qpay_invoice_response_json", allowNull: true },
      callbackJson: { type: DataTypes.TEXT, field: "callback_json", allowNull: true },
      paidAt: { type: DataTypes.DATE, field: "paid_at", allowNull: true },
      baseAdvanceMnt: { type: DataTypes.INTEGER, field: "base_advance_mnt", allowNull: true },
      memberDiscountPercent: { type: DataTypes.DECIMAL(5, 2), field: "member_discount_percent", allowNull: true },
    },
    {
      tableName: "payment_orders",
      timestamps: true,
      updatedAt: false,
      createdAt: "created_at",
      indexes: [{ fields: ["target_type", "target_id"], name: "payment_orders_target_idx" }],
    },
  );

  const BusyRole = sequelize.define(
    "BusyRole",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      slug: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      label: { type: DataTypes.STRING(190), allowNull: false },
      description: DataTypes.TEXT,
    },
    { tableName: "busy_roles", timestamps: true, updatedAt: false, createdAt: "created_at" },
  );

  const BusyPermission = sequelize.define(
    "BusyPermission",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      key: { type: DataTypes.STRING(128), allowNull: false, unique: true },
      description: DataTypes.TEXT,
    },
    { tableName: "busy_permissions", timestamps: true, updatedAt: false, createdAt: "created_at" },
  );

  const BusyRolePermission = sequelize.define(
    "BusyRolePermission",
    {
      roleId: { type: DataTypes.INTEGER, field: "role_id", primaryKey: true },
      permissionId: { type: DataTypes.INTEGER, field: "permission_id", primaryKey: true },
    },
    { tableName: "busy_role_permissions", timestamps: false },
  );

  const BusyUserRoleAssignment = sequelize.define(
    "BusyUserRoleAssignment",
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      accountId: { type: DataTypes.BIGINT, field: "account_id", allowNull: false },
      roleId: { type: DataTypes.INTEGER, field: "role_id", allowNull: false },
    },
    {
      tableName: "busy_user_role_assignments",
      timestamps: true,
      updatedAt: false,
      createdAt: "created_at",
      indexes: [
        { unique: true, fields: ["account_id", "role_id"], name: "busy_user_role_assignments_unique" },
        { fields: ["account_id"], name: "busy_user_role_assignments_account_idx" },
      ],
    },
  );

  const BusyMeetingGroup = sequelize.define(
    "BusyMeetingGroup",
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      organizerAccountId: { type: DataTypes.BIGINT, field: "organizer_account_id", allowNull: false },
      name: { type: DataTypes.STRING(255), allowNull: false },
      createdAt: { type: DataTypes.DATE, field: "created_at", allowNull: false },
      updatedAt: { type: DataTypes.DATE, field: "updated_at", allowNull: false },
    },
    {
      tableName: "busy_meeting_groups",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [{ fields: ["organizer_account_id"], name: "busy_meeting_groups_org_idx" }],
    },
  );

  const BusyWeeklyMeeting = sequelize.define(
    "BusyWeeklyMeeting",
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      groupId: { type: DataTypes.BIGINT, field: "group_id", allowNull: false },
      publicToken: { type: DataTypes.STRING(64), field: "public_token", allowNull: false, unique: true },
      meetingDate: { type: DataTypes.DATEONLY, field: "meeting_date", allowNull: false },
      startTime: { type: DataTypes.TIME, field: "start_time", allowNull: false },
      endTime: { type: DataTypes.TIME, field: "end_time", allowNull: true },
      location: { type: DataTypes.STRING(512), allowNull: true },
      feeMnt: { type: DataTypes.DECIMAL(12, 2), field: "fee_mnt", allowNull: true },
      enableMemberRegistration: {
        type: DataTypes.BOOLEAN,
        field: "enable_member_registration",
        allowNull: false,
        defaultValue: true,
      },
      enableGuestRegistration: {
        type: DataTypes.BOOLEAN,
        field: "enable_guest_registration",
        allowNull: false,
        defaultValue: true,
      },
      enableSubstituteRegistration: {
        type: DataTypes.BOOLEAN,
        field: "enable_substitute_registration",
        allowNull: false,
        defaultValue: true,
      },
      enableShortIntroduction: {
        type: DataTypes.BOOLEAN,
        field: "enable_short_introduction",
        allowNull: false,
        defaultValue: true,
      },
      enablePaymentTracking: {
        type: DataTypes.BOOLEAN,
        field: "enable_payment_tracking",
        allowNull: false,
        defaultValue: true,
      },
      createdAt: { type: DataTypes.DATE, field: "created_at", allowNull: false },
      updatedAt: { type: DataTypes.DATE, field: "updated_at", allowNull: false },
    },
    {
      tableName: "busy_weekly_meetings",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [{ fields: ["group_id", "meeting_date"], name: "busy_weekly_meetings_group_date_idx" }],
    },
  );

  const BusyMeetingRegistration = sequelize.define(
    "BusyMeetingRegistration",
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      weeklyMeetingId: { type: DataTypes.BIGINT, field: "weekly_meeting_id", allowNull: false },
      participantType: {
        type: DataTypes.ENUM("member", "guest", "substitute"),
        field: "participant_type",
        allowNull: false,
      },
      displayName: { type: DataTypes.STRING(255), field: "display_name", allowNull: false },
      companyName: { type: DataTypes.STRING(255), field: "company_name", allowNull: true },
      position: { type: DataTypes.STRING(255), allowNull: true },
      phone: { type: DataTypes.STRING(64), allowNull: true },
      email: { type: DataTypes.STRING(255), allowNull: true },
      invitedBy: { type: DataTypes.STRING(255), field: "invited_by", allowNull: true },
      businessCategory: { type: DataTypes.STRING(255), field: "business_category", allowNull: true },
      shortIntroduction: { type: DataTypes.TEXT, field: "short_introduction", allowNull: true },
      paymentStatus: {
        type: DataTypes.ENUM("unpaid", "paid", "exempted", "refunded"),
        field: "payment_status",
        allowNull: false,
        defaultValue: "unpaid",
      },
      attendanceStatus: {
        type: DataTypes.ENUM("unknown", "present", "absent", "late", "substitute_present"),
        field: "attendance_status",
        allowNull: false,
        defaultValue: "unknown",
      },
      createdAt: { type: DataTypes.DATE, field: "created_at", allowNull: false },
      updatedAt: { type: DataTypes.DATE, field: "updated_at", allowNull: false },
    },
    {
      tableName: "busy_meeting_registrations",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [{ fields: ["weekly_meeting_id"], name: "busy_meeting_registrations_meeting_idx" }],
    },
  );

  const BusyMeetingRosterExport = sequelize.define(
    "BusyMeetingRosterExport",
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      weeklyMeetingId: { type: DataTypes.BIGINT, field: "weekly_meeting_id", allowNull: false },
      format: { type: DataTypes.STRING(32), allowNull: false },
      rowCount: { type: DataTypes.INTEGER, field: "row_count", allowNull: true },
      createdByAccountId: { type: DataTypes.BIGINT, field: "created_by_account_id", allowNull: true },
    },
    {
      tableName: "busy_meeting_roster_exports",
      timestamps: true,
      updatedAt: false,
      createdAt: "created_at",
      indexes: [{ fields: ["weekly_meeting_id"], name: "busy_meeting_roster_exports_meeting_idx" }],
    },
  );

  const BusyAuditLog = sequelize.define(
    "BusyAuditLog",
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      actorAccountId: { type: DataTypes.BIGINT, field: "actor_account_id", allowNull: true },
      action: { type: DataTypes.STRING(128), allowNull: false },
      subjectType: { type: DataTypes.STRING(64), field: "subject_type", allowNull: false },
      subjectId: { type: DataTypes.STRING(64), field: "subject_id", allowNull: false },
      metadata: { type: DataTypes.JSONB, allowNull: true },
    },
    {
      tableName: "busy_audit_logs",
      timestamps: true,
      updatedAt: false,
      createdAt: "created_at",
      indexes: [
        { fields: ["subject_type", "subject_id"], name: "busy_audit_logs_subject_idx" },
        { fields: ["actor_account_id"], name: "busy_audit_logs_actor_idx" },
      ],
    },
  );

  const {
    TripRegistrationForm,
    TripFormQuestion,
    TripFormQuestionOption,
    TripFormResponse,
    TripFormResponseAnswer,
    TripParticipant,
    TripPayment,
  } = defineTripRegistrationModels(sequelize, DataTypes);

  const models = {
    PlatformAccount,
    PlatformProfile,
    Region,
    Chapter,
    ChapterMembership,
    Curriculum,
    ChapterWeeklySchedule,
    BniEvent,
    SiteSetting,
    LegacyMeeting,
    BusinessTrip,
    NewsArticle,
    LegacyMember,
    PaymentOrder,
    BusyRole,
    BusyPermission,
    BusyRolePermission,
    BusyUserRoleAssignment,
    BusyMeetingGroup,
    BusyWeeklyMeeting,
    BusyMeetingRegistration,
    BusyMeetingRosterExport,
    BusyAuditLog,
    TripRegistrationForm,
    TripFormQuestion,
    TripFormQuestionOption,
    TripFormResponse,
    TripFormResponseAnswer,
    TripParticipant,
    TripPayment,
  };

  /** Associations (mirror Prisma relations) */
  PlatformAccount.hasOne(PlatformProfile, { foreignKey: "account_id", as: "profile" });
  PlatformProfile.belongsTo(PlatformAccount, { foreignKey: "account_id", as: "account" });

  PlatformAccount.hasMany(ChapterMembership, { foreignKey: "account_id", as: "memberships" });
  ChapterMembership.belongsTo(PlatformAccount, { foreignKey: "account_id", as: "account" });

  Region.hasMany(Chapter, { foreignKey: "region_id", as: "chapters" });
  Chapter.belongsTo(Region, { foreignKey: "region_id", as: "region" });

  Chapter.hasMany(ChapterMembership, { foreignKey: "chapter_id", as: "memberships" });
  ChapterMembership.belongsTo(Chapter, { foreignKey: "chapter_id", as: "chapter" });

  Chapter.hasMany(BniEvent, { foreignKey: "chapter_id", as: "events" });
  BniEvent.belongsTo(Chapter, { foreignKey: "chapter_id", as: "chapter" });

  Chapter.hasMany(Curriculum, { foreignKey: "chapter_id", as: "curriculums" });
  Curriculum.belongsTo(Chapter, { foreignKey: "chapter_id", as: "chapter" });

  Chapter.hasMany(ChapterWeeklySchedule, { foreignKey: "chapter_id", as: "schedules" });
  ChapterWeeklySchedule.belongsTo(Chapter, { foreignKey: "chapter_id", as: "chapter" });

  Curriculum.hasMany(ChapterWeeklySchedule, { foreignKey: "curriculum_id", as: "schedules" });
  ChapterWeeklySchedule.belongsTo(Curriculum, { foreignKey: "curriculum_id", as: "curriculum" });

  Curriculum.hasMany(BniEvent, { foreignKey: "curriculum_id", as: "events" });
  BniEvent.belongsTo(Curriculum, { foreignKey: "curriculum_id", as: "curriculum" });

  ChapterWeeklySchedule.hasMany(BniEvent, { foreignKey: "schedule_id", as: "events" });
  BniEvent.belongsTo(ChapterWeeklySchedule, { foreignKey: "schedule_id", as: "schedule" });

  BusyRole.belongsToMany(BusyPermission, {
    through: BusyRolePermission,
    foreignKey: "role_id",
    otherKey: "permission_id",
    as: "permissions",
  });
  BusyPermission.belongsToMany(BusyRole, {
    through: BusyRolePermission,
    foreignKey: "permission_id",
    otherKey: "role_id",
    as: "roles",
  });

  BusyRole.hasMany(BusyUserRoleAssignment, { foreignKey: "role_id", as: "assignments" });
  BusyUserRoleAssignment.belongsTo(BusyRole, { foreignKey: "role_id", as: "role" });

  PlatformAccount.hasMany(BusyUserRoleAssignment, { foreignKey: "account_id", as: "busyRoleAssignments" });
  BusyUserRoleAssignment.belongsTo(PlatformAccount, { foreignKey: "account_id", as: "account" });

  PlatformAccount.hasMany(BusyMeetingGroup, { foreignKey: "organizer_account_id", as: "busyMeetingGroups" });
  BusyMeetingGroup.belongsTo(PlatformAccount, { foreignKey: "organizer_account_id", as: "organizer" });

  BusyMeetingGroup.hasMany(BusyWeeklyMeeting, { foreignKey: "group_id", as: "meetings" });
  BusyWeeklyMeeting.belongsTo(BusyMeetingGroup, { foreignKey: "group_id", as: "group" });

  BusyWeeklyMeeting.hasMany(BusyMeetingRegistration, { foreignKey: "weekly_meeting_id", as: "registrations" });
  BusyMeetingRegistration.belongsTo(BusyWeeklyMeeting, { foreignKey: "weekly_meeting_id", as: "meeting" });

  BusyWeeklyMeeting.hasMany(BusyMeetingRosterExport, { foreignKey: "weekly_meeting_id", as: "rosterExports" });
  BusyMeetingRosterExport.belongsTo(BusyWeeklyMeeting, { foreignKey: "weekly_meeting_id", as: "meeting" });

  PlatformAccount.hasMany(TripFormResponse, { foreignKey: "submitted_by_user_id", as: "tripFormResponses" });
  TripFormResponse.belongsTo(PlatformAccount, { foreignKey: "submitted_by_user_id", as: "submitter" });

  PlatformAccount.hasMany(TripParticipant, { foreignKey: "user_id", as: "tripParticipants" });
  TripParticipant.belongsTo(PlatformAccount, { foreignKey: "user_id", as: "account" });

  BusinessTrip.hasMany(TripRegistrationForm, { foreignKey: "trip_id", as: "tripRegistrationForms" });
  TripRegistrationForm.belongsTo(BusinessTrip, { foreignKey: "trip_id", as: "trip" });

  BniEvent.hasMany(TripRegistrationForm, { foreignKey: "event_id", as: "tripRegistrationForms" });
  TripRegistrationForm.belongsTo(BniEvent, { foreignKey: "event_id", as: "event" });

  TripRegistrationForm.hasMany(TripFormQuestion, { foreignKey: "form_id", as: "questions" });
  TripFormQuestion.belongsTo(TripRegistrationForm, { foreignKey: "form_id", as: "form" });

  TripFormQuestion.hasMany(TripFormQuestionOption, { foreignKey: "question_id", as: "options" });
  TripFormQuestionOption.belongsTo(TripFormQuestion, { foreignKey: "question_id", as: "question" });

  TripRegistrationForm.hasMany(TripFormResponse, { foreignKey: "form_id", as: "responses" });
  TripFormResponse.belongsTo(TripRegistrationForm, { foreignKey: "form_id", as: "form" });

  BusinessTrip.hasMany(TripFormResponse, { foreignKey: "trip_id", as: "tripFormResponses" });
  TripFormResponse.belongsTo(BusinessTrip, { foreignKey: "trip_id", as: "trip" });

  BniEvent.hasMany(TripFormResponse, { foreignKey: "event_id", as: "tripFormResponses" });
  TripFormResponse.belongsTo(BniEvent, { foreignKey: "event_id", as: "event" });

  TripFormResponse.hasMany(TripFormResponseAnswer, { foreignKey: "response_id", as: "answers" });
  TripFormResponseAnswer.belongsTo(TripFormResponse, { foreignKey: "response_id", as: "response" });

  TripFormQuestion.hasMany(TripFormResponseAnswer, { foreignKey: "question_id", as: "answers" });
  TripFormResponseAnswer.belongsTo(TripFormQuestion, { foreignKey: "question_id", as: "question" });

  TripFormResponse.hasOne(TripParticipant, { foreignKey: "response_id", as: "participant" });
  TripParticipant.belongsTo(TripFormResponse, { foreignKey: "response_id", as: "response" });

  BusinessTrip.hasMany(TripParticipant, { foreignKey: "trip_id", as: "tripParticipants" });
  TripParticipant.belongsTo(BusinessTrip, { foreignKey: "trip_id", as: "trip" });

  BusinessTrip.hasMany(TripPayment, { foreignKey: "trip_id", as: "tripPayments" });
  TripPayment.belongsTo(BusinessTrip, { foreignKey: "trip_id", as: "trip" });

  TripParticipant.hasMany(TripPayment, { foreignKey: "participant_id", as: "payments" });
  TripPayment.belongsTo(TripParticipant, { foreignKey: "participant_id", as: "participant" });

  return models;
}

module.exports = initModels;
