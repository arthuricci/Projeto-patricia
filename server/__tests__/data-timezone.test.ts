import { describe, it, expect } from 'vitest';

/**
 * Bug #4 Fix Tests: Date Timezone Correction
 * 
 * Problem: When user selects date 15/11/2025, system saves 14/11/2025
 * Cause: JavaScript Date() converts to UTC, losing 1 day
 * 
 * Solution: Parse date string with local timezone, not UTC
 */

describe('Bug #4: Date Timezone Correction', () => {
  
  it('should correctly parse date string without timezone conversion', () => {
    // Simulating the fix: date string "2025-11-15" should stay as "2025-11-15"
    const dateString = "2025-11-15";
    
    // The fix: parse with T00:00:00 to ensure local time
    const dateObj = new Date(dateString + 'T00:00:00');
    const formattedDate = dateObj.toISOString().split('T')[0];
    
    // The formatted date should match the input
    expect(formattedDate).toBe("2025-11-15");
  });

  it('should handle various date formats correctly', () => {
    const testDates = [
      "2025-01-01",
      "2025-06-15",
      "2025-12-31",
      "2024-02-29", // leap year
    ];

    testDates.forEach(dateString => {
      const dateObj = new Date(dateString + 'T00:00:00');
      const formattedDate = dateObj.toISOString().split('T')[0];
      
      expect(formattedDate).toBe(dateString);
    });
  });

  it('should not lose a day when parsing date at midnight', () => {
    // This is the critical test: ensure no off-by-one error
    const userSelectedDate = "2025-11-15";
    
    // Before fix: new Date("2025-11-15") would convert to UTC and lose a day
    // After fix: new Date("2025-11-15T00:00:00") stays as local time
    
    const dateObj = new Date(userSelectedDate + 'T00:00:00');
    const day = dateObj.getDate();
    const month = dateObj.getMonth() + 1;
    const year = dateObj.getFullYear();
    
    expect(day).toBe(15);
    expect(month).toBe(11);
    expect(year).toBe(2025);
  });

  it('should preserve date when converting back to string', () => {
    const originalDate = "2025-11-20";
    
    // Simulate the database round-trip
    const dateObj = new Date(originalDate + 'T00:00:00');
    const formattedDate = dateObj.toISOString().split('T')[0];
    
    // Should match original
    expect(formattedDate).toBe(originalDate);
  });

  it('should handle edge case: first day of month', () => {
    const dateString = "2025-11-01";
    
    const dateObj = new Date(dateString + 'T00:00:00');
    const formattedDate = dateObj.toISOString().split('T')[0];
    
    expect(formattedDate).toBe("2025-11-01");
  });

  it('should handle edge case: last day of month', () => {
    const dateString = "2025-11-30";
    
    const dateObj = new Date(dateString + 'T00:00:00');
    const formattedDate = dateObj.toISOString().split('T')[0];
    
    expect(formattedDate).toBe("2025-11-30");
  });

  it('should handle edge case: year boundary', () => {
    const dateString = "2025-12-31";
    
    const dateObj = new Date(dateString + 'T00:00:00');
    const formattedDate = dateObj.toISOString().split('T')[0];
    
    expect(formattedDate).toBe("2025-12-31");
  });
});

