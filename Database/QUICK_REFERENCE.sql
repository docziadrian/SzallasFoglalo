-- ================================================================
-- QUICK REFERENCE - Room Availability System
-- ================================================================

-- 1. VIEW ALL ACCOMMODATIONS WITH AVAILABILITY
-- ================================================================
SELECT 
    id,
    name,
    maxRooms,
    reservedRooms,
    availableRooms,
    CONCAT(availableRooms, '/', maxRooms) AS 'Available/Total'
FROM accomodations;


-- 2. CREATE A NEW BOOKING (automatically updates availability)
-- ================================================================
INSERT INTO bookings (userId, accommodationId, startDate, endDate, persons, totalPrice, status)
VALUES (
    1,                    -- userId
    1,                    -- accommodationId
    '2025-12-20',         -- startDate
    '2025-12-25',         -- endDate
    2,                    -- persons
    107205.00,            -- totalPrice
    'confirmed'           -- status
);


-- 3. CANCEL A BOOKING (automatically frees up room)
-- ================================================================
UPDATE bookings 
SET status = 'cancelled' 
WHERE id = 1;


-- 4. CHECK AVAILABILITY FOR SPECIFIC DATES
-- ================================================================
CALL CheckRoomAvailability(
    1,                    -- accommodationId
    '2025-12-20',         -- startDate
    '2025-12-25',         -- endDate
    @available            -- output variable
);
SELECT @available AS 'Available Rooms for Date Range';


-- 5. FIND ACCOMMODATIONS WITH AVAILABLE ROOMS
-- ================================================================
SELECT 
    id,
    name,
    city,
    availableRooms,
    priceforone
FROM accomodations
WHERE availableRooms > 0
ORDER BY availableRooms DESC;


-- 6. GET BOOKING HISTORY WITH AVAILABILITY
-- ================================================================
SELECT 
    b.id,
    b.startDate,
    b.endDate,
    b.status,
    a.name AS accommodation,
    a.availableRooms AS current_availability
FROM bookings b
JOIN accomodations a ON b.accommodationId = a.id
ORDER BY b.createdAt DESC;


-- 7. RESET RESERVED ROOMS (if needed)
-- ================================================================
UPDATE accomodations 
SET reservedRooms = (
    SELECT COUNT(*) 
    FROM bookings 
    WHERE accommodationId = accomodations.id 
    AND status != 'cancelled'
);


-- 8. FIND FULLY BOOKED ACCOMMODATIONS
-- ================================================================
SELECT 
    id,
    name,
    city,
    maxRooms,
    reservedRooms
FROM accomodations
WHERE availableRooms = 0;


-- 9. GET AVAILABILITY STATISTICS
-- ================================================================
SELECT 
    COUNT(*) AS total_accommodations,
    SUM(maxRooms) AS total_rooms,
    SUM(reservedRooms) AS total_reserved,
    SUM(availableRooms) AS total_available,
    ROUND(SUM(reservedRooms) / SUM(maxRooms) * 100, 2) AS occupancy_percentage
FROM accomodations;


-- 10. CHANGE MAX ROOMS FOR AN ACCOMMODATION
-- ================================================================
UPDATE accomodations 
SET maxRooms = 8 
WHERE id = 1;
-- availableRooms will automatically recalculate!


-- ================================================================
-- FRONTEND TYPESCRIPT EXAMPLES
-- ================================================================

/*
// Check if booking is possible
canBook(): boolean {
  return this.szallasData.availableRooms > 0;
}

// Get availability indicator
getAvailabilityClass(): string {
  const rooms = this.szallasData.availableRooms;
  if (rooms >= 3) return 'bg-green-500';
  if (rooms >= 1) return 'bg-yellow-500';
  return 'bg-red-500';
}

// Get availability text
getAvailabilityText(): string {
  const rooms = this.szallasData.availableRooms;
  if (rooms === 0) return 'Telt ház';
  if (rooms === 1) return 'Csak 1 szoba maradt!';
  if (rooms <= 3) return `Csak ${rooms} szoba maradt`;
  return `${rooms} szoba elérhető`;
}

// Before creating booking
if (this.szallasData.availableRooms <= 0) {
  this.notificationService.show('Sajnáljuk, nincs szabad szoba!', 'error');
  return;
}

// Create booking
await this.apiService.createBooking({
  userId: this.currentUser.id,
  accommodationId: this.szallasData.id,
  startDate: this.checkInDate,
  endDate: this.checkOutDate,
  persons: this.guests,
  totalPrice: this.totalPrice,
  status: 'confirmed'
});
*/

-- ================================================================
-- NOTES
-- ================================================================
-- • availableRooms is VIRTUAL - automatically calculated
-- • Triggers handle all updates automatically
-- • Use CheckRoomAvailability for date-specific queries
-- • System prevents overbooking through database constraints
-- ================================================================
