# Complete Tour Fields Implementation Guide

This document provides a comprehensive guide for implementing all tour database fields across the UI, ensuring every column is utilized and displayed appropriately.

## 📋 Table of Contents

1. [Public Tour Detail Page](#1-public-tour-detail-page)
2. [Public Tour Listing & Filters](#2-public-tour-listing--filters)
3. [Admin Tour List & Management](#3-admin-tour-list--management)
4. [Admin Create/Edit Form](#4-admin-createedit-form)
5. [Functional Logic & Business Rules](#5-functional-logic--business-rules)

---

## 1. Public Tour Detail Page

**Route:** `/tours/[slug]`

### A. Hero Section ✅ (Already Implemented)

**Fields Used:**
- `title` (name) - Main heading
- `primary_destination`, `destination_country`, `destination_state` - Location display
- `region`, `region_tags` - Region badges
- `duration_days`, `duration_nights` - Duration display
- `featured_image` (heroImageUrl/featuredImage) - Background image
- `price`, `original_price`, `currency` - Price block
- `best_for` - Best for pills
- `tour_type`, `tour_sub_type` - Type badges
- `highlights` - First 2-3 shown
- `group_size_min`, `group_size_max` - Group size info
- `difficulty_level` - Difficulty indicator

**Current Status:** ✅ Fully implemented in `src/app/tours/[id]/page.tsx`

### B. Photo Gallery ✅ (Already Implemented)

**Fields Used:**
- `images` (galleryImageUrls) - Gallery array
- `featured_image` - Primary image

**Current Status:** ✅ Implemented with lightbox-ready structure

### C. Overview Section ✅ (Already Implemented)

**Fields Used:**
- `short_description` - First paragraph
- `description` - Full description (expandable)
- `highlights` - Bullet list
- `best_for` - Tags
- `themes` - Theme chips

**Current Status:** ✅ Implemented

### D. Itinerary Section ✅ (Already Implemented)

**Fields Used:**
- `itinerary` - Structured JSON or rich text
- `duration_days`, `duration_nights` - Duration context
- `cities_covered` - City timeline

**Current Status:** ✅ Uses TourDay model for structured itinerary

### E. Inclusions/Exclusions ✅ (Already Implemented)

**Fields Used:**
- `inclusions` - What's included list
- `exclusions` - What's not included list
- `booking_policies` - Booking policy section
- `cancellation_terms` - Cancellation section

**Current Status:** ✅ Implemented

### F. Dates & Availability ⚠️ (Needs Enhancement)

**Fields Used:**
- `available_dates` - Array of departure dates
- `booking_deadline` - Deadline per date or general
- `seasonal_pricing` - Price overrides by date range
- `status` - ACTIVE/INACTIVE/DRAFT
- `minimum_travelers`, `maximum_travelers` - Traveler limits
- `package_type` - Fixed departure vs On-demand

**Current Status:** ⚠️ Basic implementation exists, needs:
- [ ] Seasonal pricing calculation logic
- [ ] Interactive date picker for on-demand tours
- [ ] Date validation (past dates, booking deadlines)
- [ ] Price display with seasonal overrides

**Implementation Needed:**

```typescript
// Add to BookingSidebar component
const calculatePriceForDate = (selectedDate: Date) => {
  // Check seasonal_pricing for date range match
  if (seasonalPricing) {
    for (const [season, data] of Object.entries(seasonalPricing)) {
      const from = new Date(data.from);
      const to = new Date(data.to);
      if (selectedDate >= from && selectedDate <= to) {
        return data.price || basePrice;
      }
    }
  }
  return basePrice;
};
```

### G. Hotels & Categories ✅ (Already Implemented)

**Fields Used:**
- `hotel_categories` - Available hotel options

**Current Status:** ✅ Implemented

### H. Customization Options ✅ (Already Implemented)

**Fields Used:**
- `customization_options` - JSON object with options

**Current Status:** ✅ Implemented, displays options with pricing

### I. "Who is this tour best for" ✅ (Already Implemented)

**Fields Used:**
- `best_for` - Target audience
- `difficulty_level` - Activity level
- `themes` - Theme tags

**Current Status:** ✅ Implemented in hero and overview sections

### J. SEO & Social ✅ (Already Implemented)

**Fields Used:**
- `meta_title`, `meta_description`, `meta_keywords`, `canonical_url`
- `og_title`, `og_description`, `og_image`
- `twitter_title`, `twitter_description`, `twitter_image`

**Current Status:** ✅ Fully implemented in `generateMetadata()`

### K. Booking Sidebar ⚠️ (Needs Enhancement)

**Current Status:** ⚠️ Basic implementation exists, needs:
- [ ] Interactive date selector (fixed departure dropdown or date picker)
- [ ] Traveler count input with validation
- [ ] Hotel category selector
- [ ] Customization options checkboxes
- [ ] Live price calculation
- [ ] Seasonal pricing integration

**Implementation Needed:**

Create a client component `BookingSidebarClient.tsx`:

```typescript
"use client";
import { useState, useMemo } from "react";
import { DatePicker } from "@/components/ui/DatePicker";
import { TravelerSelector } from "@/components/ui/TravelerSelector";

export function BookingSidebarClient({ tour, basePrice, seasonalPricing, ... }) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [hotelCategory, setHotelCategory] = useState("");
  const [customizations, setCustomizations] = useState<Record<string, boolean>>({});

  const calculatedPrice = useMemo(() => {
    let price = calculatePriceForDate(selectedDate) || basePrice;
    // Apply per-person pricing
    let total = price * adults + (price * 0.7 * children); // Child discount
    // Add customization costs
    // Add hotel category premium
    return total;
  }, [selectedDate, adults, children, hotelCategory, customizations]);

  // Validation
  const totalTravelers = adults + children;
  const isValid = 
    totalTravelers >= (tour.minimumTravelers || 1) &&
    totalTravelers <= (tour.maximumTravelers || 50) &&
    selectedDate !== null;

  return (
    // Interactive booking form with live price updates
  );
}
```

---

## 2. Public Tour Listing & Filters

**Route:** `/tours`

### Current Status: ⚠️ Basic filters exist, needs enhancement

**Fields to Use in Filters:**

1. **Destination Filter:**
   - `destination_country`
   - `destination_state`
   - `primary_destination`
   - `region`

2. **Duration Filter:**
   - Range slider: `duration_days` (min-max)

3. **Budget Filter:**
   - Range slider: `price` (min-max)
   - Consider `seasonal_pricing` min/max

4. **Tour Type Filter:**
   - `tour_type` (Group/Private/Fixed departure)
   - `tour_sub_type` (Honeymoon/Family/Adventure)

5. **Themes Filter:**
   - Multi-select: `themes` array

6. **Region Filter:**
   - Dropdown: `region`

7. **Best For Filter:**
   - Multi-select: `best_for` array

8. **Difficulty Filter:**
   - Checkboxes: `difficulty_level` (Easy/Moderate/Difficult)

**Sort Options:**
- Price: Low → High / High → Low
- Duration: Short → Long
- Newest → Oldest (`created_at`)
- Featured First (`is_featured`)

**Implementation Needed:**

Update `ToursGridClient.tsx`:

```typescript
interface TourFilters {
  destination?: string;
  region?: string;
  tourType?: string;
  tourSubType?: string;
  themes?: string[];
  bestFor?: string[];
  difficultyLevel?: string;
  durationMin?: number;
  durationMax?: number;
  priceMin?: number;
  priceMax?: number;
  sortBy?: "price_asc" | "price_desc" | "duration_asc" | "duration_desc" | "newest" | "featured";
}

export function ToursGridClient({ tours, ... }) {
  const [filters, setFilters] = useState<TourFilters>({});
  
  const filteredTours = useMemo(() => {
    return tours.filter(tour => {
      // Apply all filters
      if (filters.destination && !matchesDestination(tour, filters.destination)) return false;
      if (filters.region && tour.region !== filters.region) return false;
      if (filters.tourType && tour.tourType !== filters.tourType) return false;
      if (filters.durationMin && (tour.durationDays || 0) < filters.durationMin) return false;
      if (filters.durationMax && (tour.durationDays || 0) > filters.durationMax) return false;
      if (filters.priceMin && tour.price < filters.priceMin) return false;
      if (filters.priceMax && tour.price > filters.priceMax) return false;
      // ... more filters
      return true;
    }).sort((a, b) => {
      // Apply sorting
      switch (filters.sortBy) {
        case "price_asc": return a.price - b.price;
        case "price_desc": return b.price - a.price;
        // ... more sorts
      }
    });
  }, [tours, filters]);

  return (
    <div>
      <FilterPanel filters={filters} onChange={setFilters} />
      <ToursGrid tours={filteredTours} />
    </div>
  );
}
```

---

## 3. Admin Tour List & Management

**Route:** `/admin/content/tours`

### Current Status: ✅ Basic list exists

**Enhancements Needed:**

1. **Table Columns:**
   - ✅ Checkbox (bulk actions)
   - ✅ Title
   - ✅ Destination
   - ✅ Tour Type
   - ✅ Price
   - ✅ Featured
   - ✅ Status
   - ✅ Updated At
   - ➕ Add: `package_type`, `duration_days`, `region`

2. **Bulk Actions:**
   - ✅ Bulk publish/unpublish
   - ✅ Bulk feature/unfeature
   - ✅ Bulk delete
   - ➕ Add: Bulk assign to category, Bulk update region

3. **Filters:**
   - ✅ Status filter
   - ✅ Search
   - ➕ Add: Destination, Region, Tour Type, Package Type, Featured

**Implementation:**

Update `src/app/admin/content/tours/page.tsx`:

```typescript
const [filters, setFilters] = useState({
  status: "all", // all | active | inactive | draft
  destination: "",
  region: "",
  tourType: "",
  packageType: "",
  featured: "all", // all | yes | no
  search: "",
});

// Apply filters in API call or client-side
```

---

## 4. Admin Create/Edit Form

**Route:** `/admin/content/tours/new` & `/admin/content/tours/[id]`

### Current Status: ⚠️ Form exists but needs organization into sections

**Required Sections:**

### Section 1: Basic Info ✅
- `title` (required)
- `slug` (auto-generate, allow override)
- `short_description` (required)
- `description` (rich text editor)
- `tour_type` (dropdown)
- `tour_sub_type` (dropdown)
- `best_for` (multi-select)

### Section 2: Destination & Categorization ✅
- `destination_country`
- `destination_state`
- `primary_destination`
- `cities_covered` (tag input)
- `region` (dropdown)
- `region_tags` (tag input)
- `country_id` (if using Country relation)
- `category_id` (if using categories)
- `themes` (tag multi-select)

### Section 3: Duration & Group Size ✅
- `duration_days`, `duration_nights`
- `group_size_min`, `group_size_max`
- `minimum_travelers`, `maximum_travelers`
- `difficulty_level` (dropdown)

### Section 4: Pricing ⚠️ (Needs Enhancement)
- `currency`
- `price`
- `original_price`
- `package_type` (enum: FIXED_DEPARTURE / ON_DEMAND / PRIVATE)
- `seasonal_pricing` (complex JSON - needs UI table)

**Seasonal Pricing UI:**

```typescript
interface SeasonalPricingRow {
  name: string;
  from: string; // Date
  to: string; // Date
  price: number;
  notes?: string;
}

// Component: SeasonalPricingEditor
// - Add/remove rows
// - Date pickers for from/to
// - Price input
// - Notes field
// - Convert to JSON on save
```

### Section 5: Dates & Availability ⚠️ (Needs Enhancement)
- `available_dates` (array - date picker with multiple dates)
- `booking_deadline` (date picker or "X days before" input)
- `status` (DRAFT / ACTIVE / INACTIVE)
- `featured` (boolean)

**Available Dates UI:**

```typescript
// For FIXED_DEPARTURE:
// - Multi-date picker
// - Add/remove dates
// - Show list of selected dates

// For ON_DEMAND:
// - "Valid from" date
// - "Valid until" date
// - Or leave empty for always available
```

### Section 6: Images & Media ✅
- `featured_image` (file upload)
- `images` (multi-file upload gallery)
- `og_image`
- `twitter_image`

### Section 7: Itinerary & Content ✅
- `itinerary` (uses TourDay model - already implemented)
- `highlights` (list of bullet points)
- `inclusions` (multi-line or structured)
- `exclusions` (multi-line or structured)
- `hotel_categories` (tag input)
- `customization_options` (structured editor)
- `booking_policies` (rich text)
- `cancellation_terms` (rich text)

### Section 8: SEO & Social ✅
- `meta_title`
- `meta_description`
- `meta_keywords`
- `canonical_url`
- `og_title`, `og_description`, `og_image`
- `twitter_title`, `twitter_description`, `twitter_image`

**SEO Preview Component:**

```typescript
// Show live preview of:
// - Google search result snippet
// - Facebook/Open Graph card
// - Twitter card
```

---

## 5. Functional Logic & Business Rules

### A. Tour Visibility Rules

```typescript
// Only show tours that are:
// 1. status === "active" OR (status === null AND isActive === true)
// 2. For fixed departure: at least one available_date >= today
// 3. For on-demand: no date restrictions (or valid date range)

const isTourVisible = (tour: Tour) => {
  if (tour.status !== "active" && !(tour.status === null && tour.isActive)) {
    return false;
  }
  
  if (tour.packageType === "fixed_departure") {
    const availableDates = parseJsonArray(tour.availableDates);
    const futureDates = availableDates.filter(date => new Date(date) >= new Date());
    return futureDates.length > 0;
  }
  
  return true;
};
```

### B. Date Selection Logic

```typescript
// For FIXED_DEPARTURE:
// - Only allow dates from available_dates
// - Check booking_deadline (no booking within X days)
// - Disable past dates

// For ON_DEMAND:
// - Allow any date from today to +12 months (or custom range)
// - Apply seasonal_pricing based on selected date range

const canSelectDate = (date: Date, tour: Tour) => {
  if (date < new Date()) return false; // Past dates
  
  if (tour.packageType === "fixed_departure") {
    const availableDates = parseJsonArray(tour.availableDates);
    const dateStr = date.toISOString().split('T')[0];
    if (!availableDates.includes(dateStr)) return false;
    
    // Check booking deadline
    if (tour.bookingDeadline) {
      const deadline = new Date(tour.bookingDeadline);
      const daysUntil = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const deadlineDays = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil < deadlineDays) return false;
    }
  }
  
  return true;
};
```

### C. Price Calculation Logic

```typescript
const calculateTourPrice = (
  tour: Tour,
  selectedDate: Date | null,
  adults: number,
  children: number,
  hotelCategory?: string,
  customizations?: Record<string, boolean>
) => {
  // Base price
  let basePrice = tour.basePriceInInr || tour.price || 0;
  
  // Apply seasonal pricing
  if (selectedDate && tour.seasonalPricing) {
    const seasonal = parseJsonObject(tour.seasonalPricing);
    for (const [season, data] of Object.entries(seasonal)) {
      const from = new Date(data.from);
      const to = new Date(data.to);
      if (selectedDate >= from && selectedDate <= to && data.price) {
        basePrice = data.price;
        break;
      }
    }
  }
  
  // Per-person calculation
  let total = basePrice * adults;
  
  // Child pricing (if tour has child pricing settings)
  if (children > 0) {
    const childPrice = calculateChildPrice(
      basePrice,
      tour.childPricingType,
      tour.childPricingValue
    );
    total += childPrice * children;
  }
  
  // Hotel category premium (if applicable)
  if (hotelCategory && tour.hotelCategories) {
    // Add premium based on category
    // This would need to be stored in hotelCategories JSON
  }
  
  // Customization options
  if (customizations && tour.customizationOptions) {
    const options = parseJsonObject(tour.customizationOptions);
    for (const [key, enabled] of Object.entries(customizations)) {
      if (enabled && options[key]) {
        const option = options[key];
        if (typeof option === "object" && option.price) {
          if (option.type === "per_person") {
            total += option.price * (adults + children);
          } else {
            total += option.price;
          }
        }
      }
    }
  }
  
  return total;
};
```

### D. Traveler Validation

```typescript
const validateTravelers = (
  adults: number,
  children: number,
  tour: Tour
): { valid: boolean; error?: string } => {
  const total = adults + children;
  
  if (total < (tour.minimumTravelers || 1)) {
    return {
      valid: false,
      error: `Minimum ${tour.minimumTravelers} traveler(s) required`,
    };
  }
  
  if (tour.maximumTravelers && total > tour.maximumTravelers) {
    return {
      valid: false,
      error: `Maximum ${tour.maximumTravelers} traveler(s) allowed`,
    };
  }
  
  if (adults < 1) {
    return {
      valid: false,
      error: "At least one adult is required",
    };
  }
  
  return { valid: true };
};
```

### E. SEO Fallbacks

```typescript
// In generateMetadata():
const metaTitle = tour.metaTitle || tour.name;
const metaDescription = tour.metaDescription || tour.shortDescription || tour.description?.substring(0, 160);
const ogTitle = tour.ogTitle || tour.metaTitle || tour.name;
const ogDescription = tour.ogDescription || tour.metaDescription || tour.shortDescription;
const ogImage = tour.ogImage || tour.featuredImage || tour.heroImageUrl;
```

---

## Implementation Priority

### Phase 1: Critical (Do First)
1. ✅ Fix `isActive` column query handling
2. ⚠️ Enhance booking sidebar with interactive date/traveler selection
3. ⚠️ Add seasonal pricing calculation logic
4. ⚠️ Implement date validation (booking deadlines, past dates)

### Phase 2: Important (Do Next)
5. ⚠️ Enhance tour listing filters (all filter types)
6. ⚠️ Add seasonal pricing UI in admin form
7. ⚠️ Improve available dates management in admin
8. ⚠️ Add SEO preview component in admin

### Phase 3: Nice to Have
9. ⚠️ Add bulk operations in admin
10. ⚠️ Add tour comparison feature
11. ⚠️ Add tour favorites/wishlist
12. ⚠️ Add tour reviews integration

---

## Testing Checklist

- [ ] All tour fields display correctly on detail page
- [ ] Filters work correctly on listing page
- [ ] Date selection respects booking deadlines
- [ ] Seasonal pricing calculates correctly
- [ ] Traveler validation works (min/max)
- [ ] Price calculation includes all factors
- [ ] SEO metadata renders correctly
- [ ] Admin form saves all fields correctly
- [ ] Only active tours show on public pages
- [ ] Booking flow uses all relevant fields

---

## Notes

- The current implementation is already quite comprehensive
- Most fields are already being used
- Main gaps are in interactive booking sidebar and seasonal pricing
- Admin form needs better organization but captures most fields
- Consider creating reusable components for common patterns (date pickers, tag inputs, etc.)

