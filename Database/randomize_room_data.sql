-- ================================================================
-- RANDOM ROOM AVAILABILITY DATA FOR ALL ACCOMMODATIONS
-- ================================================================
-- This script provides randomized maxRooms values for accommodations
-- Use this if you want different random values each time
-- ================================================================

-- Randomized room counts (different from the main script)
UPDATE `accomodations` SET `maxRooms` = 8, `reservedRooms` = 0 WHERE `id` = 1;  -- Hotel Karos Spa Zalakaros (8 rooms)
UPDATE `accomodations` SET `maxRooms` = 5, `reservedRooms` = 1 WHERE `id` = 2;  -- Termál Hotel Vesta Tápiószecső (5 rooms, 1 reserved)
UPDATE `accomodations` SET `maxRooms` = 10, `reservedRooms` = 0 WHERE `id` = 3; -- Hotel Palota Lillafüred (10 rooms)
UPDATE `accomodations` SET `maxRooms` = 6, `reservedRooms` = 0 WHERE `id` = 4;  -- Hunguest Hotel Gyula (6 rooms)
UPDATE `accomodations` SET `maxRooms` = 2, `reservedRooms` = 0 WHERE `id` = 5;  -- Hotel Villa Völgy Eger (2 rooms)

-- Alternative random distribution option 1:
-- UPDATE `accomodations` SET `maxRooms` = 3, `reservedRooms` = 0 WHERE `id` = 1;
-- UPDATE `accomodations` SET `maxRooms` = 9, `reservedRooms` = 1 WHERE `id` = 2;
-- UPDATE `accomodations` SET `maxRooms` = 7, `reservedRooms` = 0 WHERE `id` = 3;
-- UPDATE `accomodations` SET `maxRooms` = 4, `reservedRooms` = 0 WHERE `id` = 4;
-- UPDATE `accomodations` SET `maxRooms` = 6, `reservedRooms` = 0 WHERE `id` = 5;

-- Alternative random distribution option 2:
-- UPDATE `accomodations` SET `maxRooms` = 5, `reservedRooms` = 0 WHERE `id` = 1;
-- UPDATE `accomodations` SET `maxRooms` = 2, `reservedRooms` = 1 WHERE `id` = 2;
-- UPDATE `accomodations` SET `maxRooms` = 8, `reservedRooms` = 0 WHERE `id` = 3;
-- UPDATE `accomodations` SET `maxRooms` = 10, `reservedRooms` = 0 WHERE `id` = 4;
-- UPDATE `accomodations` SET `maxRooms` = 4, `reservedRooms` = 0 WHERE `id` = 5;

-- ================================================================
-- Verify the results
-- ================================================================
SELECT 
    id,
    name,
    maxRooms,
    reservedRooms,
    availableRooms,
    CASE 
        WHEN availableRooms >= 3 THEN 'Many available (3+)'
        WHEN availableRooms BETWEEN 1 AND 2 THEN 'Few rooms (1-2)'
        WHEN availableRooms = 0 THEN 'Fully booked'
    END AS status
FROM `accomodations`
ORDER BY id;
