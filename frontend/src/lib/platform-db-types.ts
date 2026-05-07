/** String unions / shapes that replaced `@prisma/client` types in Next apps (no DB client). */

export type PlatformRole = "visitor" | "member" | "director" | "admin";

export type PlatformAccountStatus = "active" | "suspended" | "deleted";

export type MembershipStatus = "pending" | "active" | "expired" | "transferred" | "left";

export type BusyMeetingParticipantType = "member" | "guest" | "substitute";

export type BusyMeetingPaymentStatus = "unpaid" | "paid" | "exempted" | "refunded";

export type BusyMeetingAttendanceStatus =
  | "unknown"
  | "present"
  | "absent"
  | "late"
  | "substitute_present";

export type TripFormQuestionType =
  | "SHORT_TEXT"
  | "LONG_TEXT"
  | "MULTIPLE_CHOICE"
  | "CHECKBOXES"
  | "DROPDOWN"
  | "DATE"
  | "TIME"
  | "PHONE"
  | "EMAIL"
  | "FILE_UPLOAD"
  | "NUMBER"
  | "YES_NO"
  | "COUNTRY"
  | "COMPANY_BLOCK"
  | "EMERGENCY_CONTACT_BLOCK"
  | "PAYMENT_CONFIRMATION_BLOCK";

export type TripFormResponseWorkflowStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "CONFIRMED"
  | "CANCELLED";

export type TripFormMoneyStatus = "UNPAID" | "PENDING" | "PAID" | "EXEMPTED" | "REFUNDED";

export type TripParticipantLifecycleStatus = "REGISTERED" | "CONFIRMED" | "CANCELLED";

export type PlatformProfile = {
  accountId: bigint;
  displayName: string;
  bio: string | null;
  photoUrl: string | null;
  companyName: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
  website: string | null;
  addressLine: string | null;
  businessJson: unknown | null;
  updatedAt: Date;
};

export type BusinessTrip = {
  id: number;
  destination: string;
  startDate: Date;
  endDate: Date;
  coverImageUrl: string | null;
  heroSliderJson: string | null;
  managerAccountId: bigint | null;
  isFeatured: number;
  extrasJson: unknown;
  registrationFormJson: unknown;
  itineraryJson: unknown;
  /** Display / form state from API (not in DB typings). */
  statusLabel?: string | null;
  focus?: string | null;
  priceMnt?: number | string | null;
  advanceOrderMnt?: number | string | null;
  description?: string | null;
  [key: string]: unknown;
};

/** Minimal shapes for weekly meeting roster CSV (no Prisma). */
export type BusyMeetingGroup = {
  id: bigint;
  name: string;
  organizerAccountId: bigint;
};

export type BusyWeeklyMeeting = {
  id: bigint;
  groupId: bigint;
  publicToken: string;
  meetingDate: Date;
  startTime: Date;
  endTime: Date | null;
  location: string | null;
  feeMnt: unknown;
  enableShortIntroduction: boolean;
  enableMemberRegistration: boolean;
  enableGuestRegistration: boolean;
  enableSubstituteRegistration: boolean;
  enablePaymentTracking: boolean;
};

export type BusyMeetingRegistration = {
  participantType: BusyMeetingParticipantType;
  displayName: string;
  companyName: string | null;
  position: string | null;
  businessCategory: string | null;
  phone: string | null;
  email: string | null;
  invitedBy: string | null;
  shortIntroduction: string | null;
  paymentStatus: BusyMeetingPaymentStatus;
  attendanceStatus: BusyMeetingAttendanceStatus;
};

export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };
