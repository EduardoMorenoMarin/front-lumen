export type ReservationStatus = 'PENDING' | 'ACCEPTED' | 'CANCELED';

export interface ReservationItem {
  id: string;
  productId: string;
  productTitle: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Reservation {
  id: string;
  code: string;
  status: ReservationStatus;
  reservationDate: string;
  pickupDeadline: string;
  totalAmount: number;
  notes?: string;
  customerId: string;
  customerFirstName: string;
  customerLastName: string;
  customerDni: string;
  customerEmail: string;
  customerPhone: string;
  items: ReservationItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ReservationCustomerData {
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  phone: string;
}

export interface ReservationCreateRequest {
  customerId?: string;
  customerData?: ReservationCustomerData;
  items: ReservationCreateItem[];
  pickupDeadline: string;
  notes?: string;
}

export interface ReservationCreateItem {
  productId: string;
  quantity: number;
}

export type ReservationListResponse = Reservation[];
