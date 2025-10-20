# 🧭 Product Requirements Document (PRD) — *AutoTrack MVP*

## 1. 📌 Overview

**Product Name:** AutoTrack  
**Version:** MVP 1.0  
**Goal:** Provide everyday drivers with a simple way to **track car maintenance**, **log service history**, and **get reminders** — without needing advanced automotive knowledge.

AutoTrack focuses on simplicity, clarity, and ease of use. The MVP is designed for a **single vehicle** and just a few essential maintenance actions.

---

## 2. 🧠 Problem Statement

Car owners often forget routine maintenance, rely on paper receipts, or lose track of service history.  
This results in:
- Higher repair costs from neglected maintenance,  
- Missed warranty opportunities,  
- Lower resale value.

AutoTrack removes that friction by making car care **organized, automatic, and easy to manage**.

---

## 3. 🏆 Objectives & Success Metrics

| Objective                                | Success Metric                                                    |
|------------------------------------------|--------------------------------------------------------------------|
| Simplify maintenance tracking           | 90% of users can log a service in under 30 seconds                 |
| Prevent missed maintenance              | 80% of users enable notifications or reminders                    |
| Increase visibility of car health       | 70% of users add at least 3 services within the first 30 days     |

---

## 4. ✨ Core MVP Features

### 4.1 Vehicle Profile
- Users can add **one vehicle**.  
- Basic details only: Year, Make, Model, Current Mileage, VIN (optional).  
- This profile drives all maintenance scheduling.

### 4.2 Maintenance Timeline
- Displays **upcoming** and **past services** in a vertical timeline view.  
- Preloaded default service types:
  - Oil change (every 5,000 miles or 6 months)  
  - Tire rotation (every 7,500 miles or 12 months)  
  - Brake inspection (every 12 months)  
- Users can see what’s due soon at a glance.

### 4.3 Log a Service
- Simple “+ Add Service” action.  
- Users can:
  - Choose service type (from default or custom),
  - Add date and mileage,
  - Optional: cost and notes.
- After logging, the app automatically updates the timeline.

### 4.4 Reminders
- Friendly, **predictive reminders** before services are due.  
- Based on either time or mileage.
- Example:  
  *“🔧 Your oil change is coming up in 2 weeks or 500 miles.”*

### 4.5 Dashboard (Home)
- Clean, simple home screen showing:
  - Next service due (type + date/mileage),
  - Last completed service,
  - Quick Add button for logging a new service.
- Intentionally minimal — designed to be checked at a glance.

---

## 5. 🧭 User Flow

### Onboarding
1. Welcome screen with a short explanation.  
2. Add vehicle information.  
3. Timeline is automatically populated with standard service intervals.

### Adding a Service
1. User taps “+ Add Service” on dashboard.  
2. Enters service details (type, date, mileage, optional cost/notes).  
3. Timeline updates immediately with new event.  
4. Reminder is scheduled for the next due date/mileage.

### Viewing Timeline
1. User taps “Timeline” tab.  
2. Sees a vertical chronological list of:
   - Past services (with date, mileage, notes),
   - Upcoming scheduled services (with due date/mileage).

### Receiving Reminders
1. Reminder triggered based on time or mileage threshold.  
2. User taps notification to go directly to timeline or service detail.  
3. Can log new service directly from there.

---

## 6. 🪄 Content & Messaging Guidelines

- **Tone:** Friendly, simple, encouraging.  
- Avoid technical jargon (e.g., say “Tire Rotation Due” instead of “Routine Rotation Interval”).  
- Use short push notifications and minimal text in the interface.

**Example Notifications:**
- “🔧 Oil change is coming up soon. Tap to schedule or log it.”  
- “✅ Service logged. Your car’s on track!”  
- “🚗 You’re 500 miles away from your next tire rotation.”

---

## 7. 🧭 Non-Functional Requirements

- Fully mobile-friendly design — optimized for small screens and touch interactions.
- Fast and simple to use — no account required to start.  
- Works offline (service logs are always accessible).  
- Clear visual hierarchy — user always knows what’s next for their car.  
- 3 main screens only: *Dashboard*, *Timeline*, *Add Service*.

---

## 8. 🚀 Future Enhancements (Not in MVP)

These are out of scope for MVP but planned for later releases:
- Multi-vehicle support  
- OBD-II automatic mileage sync  
- Mechanic/shop booking  
- Cost analytics and reports  
- Insurance and warranty document storage  
- Gamification and badges

---

## 9. ✅ Acceptance Criteria

- [x] Users can create a vehicle profile with basic info  
- [x] Users can view upcoming and past services in a timeline  
- [x] Users can add a service with date and mileage  
- [ ] Users receive a reminder before the next service is due  
- [x] Users can see their next due service clearly on the dashboard  
- [x] Core flow works without requiring advanced car knowledge

---

✅ **Summary:**  
AutoTrack MVP delivers one thing exceptionally well — **making it effortless for everyday drivers to stay on top of maintenance.**  
No clutter, no mechanic networks, no advanced features. Just clean tracking, logging, and reminders.
