export enum UserRole {
  CUSTOMER = 'customer',
  SELLER_MICRO = 'seller_micro',
  SELLER_MACRO = 'seller_macro',
  DELIVERER = 'deliverer',
  AFFILIATE = 'affiliate',
  SERVICE_PROVIDER = 'service_provider',
  ADMIN = 'admin',
}

export enum OrderStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  PICKED_UP = 'picked_up',
  DELIVERING = 'delivering',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatarUrl?: string;
  phoneNumber?: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  // Novos campos específicos
  businessName?: string;
  nuit?: string;
  vehicleType?: string;
  licensePlate?: string;
  commission?: number;
  referralLink?: string;
  isVerified?: boolean;
  onboardingCompleted?: boolean;
  interests?: string[];
  createdAt?: any;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'promo' | 'system' | 'message';
  read: boolean;
  createdAt: any;
  link?: string;
}

export interface Wallet {
  uid: string;
  availableBalance: number;
  pendingBalance: number;
  currency: string;
  updatedAt: any;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  fee?: number;
  netAmount?: number;
  type: 'credit' | 'debit' | 'commission' | 'payout';
  status: 'pending' | 'completed' | 'cancelled';
  description: string;
  relatedOrderId?: string;
  createdAt: any;
}

export interface PayoutRequest {
  id: string;
  userId: string;
  amount: number;
  method: 'mpesa' | 'emola' | 'bank';
  methodDetails: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  createdAt: any;
  processedAt?: any;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  status: 'pending' | 'in_review' | 'resolved' | 'closed';
  category: 'complaint' | 'suggestion' | 'help' | 'billing' | 'technical';
  priority: 'low' | 'medium' | 'high';
  createdAt: any;
  updatedAt: any;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  sellerId: string;
  rating: number;
  reviewsCount: number;
  moderationStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  stock: number;
  createdAt: any;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  pricePerHour: number;
  category: string;
  imageUrl: string;
  providerId: string;
  rating: number;
  reviewsCount: number;
}

export interface FoodItem extends Product {
  restaurantName: string;
}

export interface Order {
  id: string;
  customerId: string;
  items: { id: string; quantity: number; price: number; name: string }[];
  totalPrice: number;
  status: OrderStatus;
  createdAt: number;
  type: 'product' | 'service' | 'food';
  sellerId: string;
  delivererId?: string;
  deliveryAddress: string;
  location?: { lat: number; lng: number };
}

export interface Review {
  id?: string;
  order_id: string;
  customer_id: string;
  product_id?: string;
  service_id?: string;
  rating: number;
  comment?: string;
  created_at?: string;
}

