export interface Business {
  id: string;
  name: string;
  orgNumber: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  contactPerson: string;
  email: string;
  phone: string;
  website?: string;
  industry?: string;
  numberOfEmployees?: number;
  revenue?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  bilagCount: number; // Number of accounting attachments
  status: "active" | "inactive" | "lead";
  tags?: string[];
  contacts?: Contact[];
  activities?: Activity[];
  offers?: Offer[];
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  position?: string;
  isPrimary: boolean;
  businessId: string;
  notes?: string;
}

export interface Activity {
  id: string;
  type: "call" | "meeting" | "email" | "note";
  date: Date;
  description: string;
  businessId: string;
  contactId?: string;
  userId: string;
  completed: boolean;
  outcome?: string;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  businessId: string;
  contactId?: string;
  createdAt: Date;
  expiresAt: Date;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired";
  totalAmount: number;
  currency: string;
  items: OfferItem[];
  notes?: string;
}

export interface OfferItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
  total: number;
}
