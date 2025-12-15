-- ================================================================
-- ROOM AVAILABILITY SYSTEM FOR ACCOMMODATIONS
-- ================================================================
-- This script adds room availability tracking to the accomodations table
-- and creates triggers to automatically update availability on bookings
-- ================================================================

-- Step 1: Add new columns to accomodations table
-- ================================================================
ALTER TABLE `accomodations` 
ADD COLUMN `maxRooms` INT(11) NOT NULL DEFAULT 5 COMMENT 'Maximum number of rooms available',
ADD COLUMN `reservedRooms` INT(11) NOT NULL DEFAULT 0 COMMENT 'Currently reserved rooms',
ADD COLUMN `availableRooms` INT(11) GENERATED ALWAYS AS (`maxRooms` - `reservedRooms`) VIRTUAL COMMENT 'Available rooms (calculated)';

-- Step 2: Update existing accommodations with random maxRooms (1-10)
-- ================================================================
-- Set random maxRooms for each accommodation
UPDATE `accomodations` SET `maxRooms` = 7 WHERE `id` = 1;  -- Hotel Karos Spa Zalakaros
UPDATE `accomodations` SET `maxRooms` = 4 WHERE `id` = 2;  -- Termál Hotel Vesta Tápiószecső
UPDATE `accomodations` SET `maxRooms` = 9 WHERE `id` = 3;  -- Hotel Palota Lillafüred
UPDATE `accomodations` SET `maxRooms` = 6 WHERE `id` = 4;  -- Hunguest Hotel Gyula
UPDATE `accomodations` SET `maxRooms` = 3 WHERE `id` = 5;  -- Hotel Villa Völgy Eger

-- Step 3: Set initial reservedRooms based on existing bookings
-- ================================================================
-- Update reservedRooms for accommodation ID 2 (has 1 active booking)
UPDATE `accomodations` SET `reservedRooms` = 1 WHERE `id` = 2;

-- Step 4: Create trigger to update availability when booking is created
-- ================================================================
DELIMITER $$

CREATE TRIGGER `after_booking_insert` 
AFTER INSERT ON `bookings`
FOR EACH ROW
BEGIN
    -- Increase reserved rooms count for the accommodation
    UPDATE `accomodations` 
    SET `reservedRooms` = `reservedRooms` + 1 
    WHERE `id` = NEW.accommodationId;
END$$

DELIMITER ;

-- Step 5: Create trigger to update availability when booking is updated
-- ================================================================
DELIMITER $$

CREATE TRIGGER `after_booking_update` 
AFTER UPDATE ON `bookings`
FOR EACH ROW
BEGIN
    -- If booking status changed to cancelled, decrease reserved rooms
    IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
        UPDATE `accomodations` 
        SET `reservedRooms` = `reservedRooms` - 1 
        WHERE `id` = NEW.accommodationId AND `reservedRooms` > 0;
    END IF;
    
    -- If booking status changed from cancelled to active, increase reserved rooms
    IF OLD.status = 'cancelled' AND NEW.status != 'cancelled' THEN
        UPDATE `accomodations` 
        SET `reservedRooms` = `reservedRooms` + 1 
        WHERE `id` = NEW.accommodationId;
    END IF;
END$$

DELIMITER ;

-- Step 6: Create trigger to update availability when booking is deleted
-- ================================================================
DELIMITER $$

CREATE TRIGGER `after_booking_delete` 
AFTER DELETE ON `bookings`
FOR EACH ROW
BEGIN
    -- Decrease reserved rooms count when booking is deleted
    IF OLD.status != 'cancelled' THEN
        UPDATE `accomodations` 
        SET `reservedRooms` = `reservedRooms` - 1 
        WHERE `id` = OLD.accommodationId AND `reservedRooms` > 0;
    END IF;
END$$

DELIMITER ;

-- Step 7: Create stored procedure to check room availability for date range
-- ================================================================
DELIMITER $$

CREATE PROCEDURE `CheckRoomAvailability`(
    IN p_accommodationId INT,
    IN p_startDate DATE,
    IN p_endDate DATE,
    OUT p_availableRooms INT
)
BEGIN
    DECLARE v_maxRooms INT;
    DECLARE v_bookedRooms INT;
    
    -- Get max rooms for the accommodation
    SELECT `maxRooms` INTO v_maxRooms
    FROM `accomodations`
    WHERE `id` = p_accommodationId;
    
    -- Count overlapping bookings (excluding cancelled)
    SELECT COUNT(*) INTO v_bookedRooms
    FROM `bookings`
    WHERE `accommodationId` = p_accommodationId
        AND `status` != 'cancelled'
        AND (
            (`startDate` <= p_startDate AND `endDate` > p_startDate)
            OR (`startDate` < p_endDate AND `endDate` >= p_endDate)
            OR (`startDate` >= p_startDate AND `endDate` <= p_endDate)
        );
    
    -- Calculate available rooms
    SET p_availableRooms = v_maxRooms - v_bookedRooms;
END$$

DELIMITER ;

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================
-- Run these queries to verify the setup

-- View all accommodations with room availability
SELECT 
    id,
    name,
    maxRooms,
    reservedRooms,
    availableRooms,
    CASE 
        WHEN availableRooms >= 3 THEN '🟢 Many rooms available'
        WHEN availableRooms BETWEEN 1 AND 2 THEN '🟡 Few rooms left'
        WHEN availableRooms = 0 THEN '🔴 Fully booked'
    END AS availability_status
FROM `accomodations`
ORDER BY id;

-- View bookings with accommodation details
SELECT 
    b.id,
    b.startDate,
    b.endDate,
    b.persons,
    b.status,
    a.name AS accommodation_name,
    a.availableRooms
FROM `bookings` b
JOIN `accomodations` a ON b.accommodationId = a.id
ORDER BY b.startDate DESC;

-- ================================================================
-- USAGE EXAMPLES
-- ================================================================

-- Example 1: Check availability for specific dates
-- CALL CheckRoomAvailability(1, '2025-12-20', '2025-12-25', @available);
-- SELECT @available AS 'Available Rooms';

-- Example 2: Create a new booking (triggers will automatically update availability)
-- INSERT INTO `bookings` (userId, accommodationId, startDate, endDate, persons, totalPrice, status)
-- VALUES (1, 1, '2025-12-20', '2025-12-25', 2, 107205.00, 'confirmed');

-- Example 3: Cancel a booking (trigger will automatically free up the room)
-- UPDATE `bookings` SET status = 'cancelled' WHERE id = 1;

-- ================================================================
-- NOTES
-- ================================================================
-- 1. availableRooms is a VIRTUAL column - it's automatically calculated
-- 2. Triggers ensure availability is always up-to-date
-- 3. Use the CheckRoomAvailability procedure for date-specific queries
-- 4. The system prevents overbooking by tracking reservedRooms
-- ================================================================
