export interface Booking {
  id: number;
  userId: number;
  accommodationId: number;
  startDate: string;
  endDate: string;
  persons: number;
  totalPrice: number;
  status: string;
  createdAt: string;
}
