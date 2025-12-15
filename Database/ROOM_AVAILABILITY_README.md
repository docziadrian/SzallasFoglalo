# Room Availability System - Implementation Guide

## Overview

This system tracks room availability for accommodations and automatically updates when bookings are created, updated, or deleted.

## Database Changes

### New Columns Added to `accomodations` Table

- **maxRooms** (INT): Maximum number of rooms available (1-10, randomized)
- **reservedRooms** (INT): Currently reserved rooms (default: 0)
- **availableRooms** (INT, VIRTUAL): Automatically calculated as `maxRooms - reservedRooms`

### Randomized Data

Each accommodation has been assigned random room counts:

- Hotel Karos Spa Zalakaros: 7 rooms
- Termál Hotel Vesta Tápiószecső: 4 rooms (1 reserved due to existing booking)
- Hotel Palota Lillafüred: 9 rooms
- Hunguest Hotel Gyula: 6 rooms
- Hotel Villa Völgy Eger: 3 rooms

## SQL Files Created

### 1. `add_room_availability.sql` (MAIN FILE)

Complete implementation including:

- ALTER TABLE statements to add columns
- Initial data population with randomized values
- Triggers for automatic updates
- Stored procedure for availability checking
- Verification queries

**To apply this:**

```sql
-- Run this in phpMyAdmin or MySQL client
SOURCE add_room_availability.sql;
```

### 2. `randomize_room_data.sql`

Alternative random distributions if you want different values.

## Automatic Updates (Triggers)

### When a booking is created:

```sql
INSERT INTO bookings (userId, accommodationId, startDate, endDate, persons, totalPrice, status)
VALUES (1, 1, '2025-12-20', '2025-12-25', 2, 107205.00, 'confirmed');
```

→ `reservedRooms` automatically increases by 1
→ `availableRooms` automatically decreases by 1

### When a booking is cancelled:

```sql
UPDATE bookings SET status = 'cancelled' WHERE id = 1;
```

→ `reservedRooms` automatically decreases by 1
→ `availableRooms` automatically increases by 1

### When a booking is deleted:

```sql
DELETE FROM bookings WHERE id = 1;
```

→ If booking wasn't cancelled, `reservedRooms` decreases by 1

## Frontend Integration

### Updated TypeScript Interface

```typescript
export interface Accomodation {
  id: number;
  name: string;
  // ... other fields ...
  maxRooms: number;
  reservedRooms: number;
  availableRooms: number;
}
```

### Usage in Component

```typescript
// Check if accommodation has available rooms
if (this.szallasData.availableRooms > 0) {
  // Allow booking
} else {
  // Show "Fully booked" message
}

// Display availability status
getAvailabilityStatus(): string {
  const rooms = this.szallasData.availableRooms;
  if (rooms >= 3) return '🟢 Sok szabad szoba';
  if (rooms >= 1) return '🟡 Kevés szoba';
  return '🔴 Telt ház';
}
```

## API Endpoint Updates

### Backend (index.js or accomodations.js)

The existing endpoints should automatically include the new fields:

```javascript
// GET /accomodations/:id
// Now returns maxRooms, reservedRooms, availableRooms

// POST /bookings
// Triggers automatically update availability
```

## Availability Checking for Date Ranges

Use the stored procedure to check availability for specific dates:

```sql
CALL CheckRoomAvailability(1, '2025-12-20', '2025-12-25', @available);
SELECT @available AS 'Available Rooms';
```

This accounts for overlapping bookings and returns the actual number of available rooms.

## Visual Indicators

### Calendar Colors

- 🟢 Green (3+ rooms): Many available
- 🟡 Yellow (1-2 rooms): Few rooms left
- 🔴 Red (0 rooms): Fully booked

### Implementation Example

```typescript
getCalendarEventColor(availableRooms: number): string {
  if (availableRooms >= 3) return '#22c55e'; // green
  if (availableRooms >= 1) return '#eab308'; // yellow
  return '#ef4444'; // red
}
```

## Installation Steps

1. **Backup your database first!**

   ```sql
   mysqldump -u username -p szallasfoglalov2 > backup.sql
   ```

2. **Run the main SQL file:**

   ```sql
   SOURCE C:/path/to/add_room_availability.sql;
   ```

3. **Verify installation:**

   ```sql
   SELECT * FROM accomodations;
   SHOW TRIGGERS;
   SHOW PROCEDURE STATUS WHERE Name = 'CheckRoomAvailability';
   ```

4. **Update frontend** - The interface is already updated in `accomodations.ts`

5. **Test booking creation** to verify triggers work correctly

## Testing

### Test 1: Create a booking

```sql
INSERT INTO bookings (userId, accommodationId, startDate, endDate, persons, totalPrice, status)
VALUES (1, 1, '2025-12-20', '2025-12-25', 2, 107205.00, 'confirmed');

-- Check if reservedRooms increased
SELECT id, name, reservedRooms, availableRooms FROM accomodations WHERE id = 1;
```

### Test 2: Cancel a booking

```sql
UPDATE bookings SET status = 'cancelled' WHERE id = 2;

-- Check if reservedRooms decreased
SELECT id, name, reservedRooms, availableRooms FROM accomodations WHERE id = 1;
```

### Test 3: Check date-specific availability

```sql
CALL CheckRoomAvailability(1, '2025-12-20', '2025-12-25', @available);
SELECT @available;
```

## Important Notes

1. **Virtual Column**: `availableRooms` is automatically calculated - you never need to update it manually
2. **Triggers**: Ensure they're enabled in your MySQL configuration
3. **Existing Bookings**: The script accounts for the existing booking in accommodation #2
4. **Concurrency**: The system handles concurrent bookings through MySQL's transaction system
5. **Validation**: Add frontend validation to check `availableRooms > 0` before allowing bookings

## Troubleshooting

**Triggers not working?**

```sql
SHOW TRIGGERS;
-- Should show 3 triggers: after_booking_insert, after_booking_update, after_booking_delete
```

**Wrong availability count?**

```sql
-- Recalculate from bookings
UPDATE accomodations a
SET reservedRooms = (
    SELECT COUNT(*)
    FROM bookings
    WHERE accommodationId = a.id AND status != 'cancelled'
);
```

**Need to reset?**

```sql
UPDATE accomodations SET reservedRooms = 0;
-- Then recount from active bookings
```

## Future Enhancements

1. Add date-range availability tracking
2. Implement seasonal pricing based on availability
3. Add email notifications when rooms become available
4. Create admin dashboard for room management
5. Add overbooking prevention in backend API

## Support

For issues or questions, refer to:

- MySQL Trigger documentation
- FullCalendar API for visual integration
- Angular reactive forms for booking validation
