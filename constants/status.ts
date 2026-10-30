import { Colors } from '@/constants/theme';
import type {
  BookingStatus,
  EnquiryStatus,
  ReportStatus,
  ReviewStatus,
  ShopStatus,
  UserRole,
} from '@/types';

interface StatusMeta {
  label: string;
  color: string;
}

export const BOOKING_STATUS: Record<BookingStatus, StatusMeta> = {
  pending: { label: 'Pending', color: Colors.warning[500] },
  confirmed: { label: 'Confirmed', color: Colors.electric[400] },
  in_progress: { label: 'In progress', color: Colors.accent[500] },
  completed: { label: 'Completed', color: Colors.success[500] },
  rejected: { label: 'Declined', color: Colors.error[500] },
  cancelled: { label: 'Cancelled', color: Colors.charcoal[400] },
};

export const ENQUIRY_STATUS: Record<EnquiryStatus, StatusMeta> = {
  open: { label: 'Awaiting reply', color: Colors.warning[500] },
  responded: { label: 'Replied', color: Colors.success[500] },
  closed: { label: 'Closed', color: Colors.charcoal[400] },
};

export const SHOP_STATUS: Record<ShopStatus, StatusMeta> = {
  pending: { label: 'Pending review', color: Colors.warning[500] },
  approved: { label: 'Live', color: Colors.success[500] },
  rejected: { label: 'Rejected', color: Colors.error[500] },
  suspended: { label: 'Suspended', color: Colors.error[600] },
};

export const REVIEW_STATUS: Record<ReviewStatus, StatusMeta> = {
  published: { label: 'Published', color: Colors.success[500] },
  hidden: { label: 'Hidden', color: Colors.error[500] },
};

export const REPORT_STATUS: Record<ReportStatus, StatusMeta> = {
  open: { label: 'Open', color: Colors.warning[500] },
  resolved: { label: 'Resolved', color: Colors.success[500] },
  dismissed: { label: 'Dismissed', color: Colors.charcoal[400] },
};

export const ROLE_META: Record<UserRole, StatusMeta> = {
  customer: { label: 'Customer', color: Colors.accent[500] },
  shop_owner: { label: 'Shop Owner', color: Colors.electric[400] },
  admin: { label: 'Admin', color: Colors.error[500] },
};

/** Next actions available to a shop owner for a booking, mirroring the DB state machine. */
export const OWNER_BOOKING_ACTIONS: Record<BookingStatus, { status: BookingStatus; label: string }[]> = {
  pending: [
    { status: 'confirmed', label: 'Accept' },
    { status: 'rejected', label: 'Decline' },
  ],
  confirmed: [
    { status: 'in_progress', label: 'Start work' },
    { status: 'completed', label: 'Mark complete' },
    { status: 'cancelled', label: 'Cancel' },
  ],
  in_progress: [{ status: 'completed', label: 'Mark complete' }],
  completed: [],
  rejected: [],
  cancelled: [],
};

export const REPORT_REASONS = [
  'Spam or advertising',
  'Fake or misleading',
  'Offensive or abusive',
  'Not about this shop',
  'Other',
];
