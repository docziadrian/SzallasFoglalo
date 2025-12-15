export interface Accomodation {
  id: number;
  name: string;
  url: string;
  cover_image: string;
  title: string;
  description: string;
  postal_code: string;
  city: string;
  street: string;
  full_address: string;
  priceforone: number;
  avgrating: number; // from: 1.0 to:10.0
  maxRooms: number; // Maximum number of rooms available (1-10)
  reservedRooms: number; // Currently reserved rooms
  availableRooms: number; // Available rooms (calculated: maxRooms - reservedRooms)
}
