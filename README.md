# Hidaya Backend — Complete Setup Guide

Node.js + Express + MySQL REST API for Hidaya Islamic Academy SMS.

---

## Quick Start (3 steps)

### 1 — Start MAMP
Open MAMP → Start Servers → wait for MySQL green light.

### 2 — Import the database
1. Open **http://localhost/phpmyadmin**
2. Click **New** → name: `hidayadb` → click **Create**
3. Click `hidayadb` → **SQL** tab → paste contents of `db/schema.sql` → **Go**

### 3 — Run the backend
```cmd
cd Hidaya-backend
npm install
npm run seed       ← loads all demo data
npm run dev        ← starts server on port 5000
```

You should see:
```
🚀 Hidaya backend running → http://localhost:5000
✅ MySQL connected to hidayadb
```

---

## Test it
```
GET http://localhost:5000/api/health
```
Response: `{ "success": true, "data": { "message": "Hidaya API running ✅" } }`

---

## Login Accounts (after seed)

| Role      | Login ID  | Password    |
|-----------|-----------|-------------|
| Owner     | owner01   | owner123    |
| Manager   | mgr01     | manager123  |
| Assistant | a01       | pass01      |
| Assistant | a02       | pass02      |
| Teacher   | t01       | pass01      |
| Teacher   | t02       | pass02      |
| Teacher   | t03       | pass03      |
| Teacher   | t04       | pass04      |

---

## All API Endpoints

### Auth
| Method | URL | Auth |
|--------|-----|------|
| POST | /api/auth/login | — |
| POST | /api/auth/register | — |
| GET  | /api/auth/me | Bearer |
| PUT  | /api/auth/change-password | Bearer |

### Students
| GET/POST | /api/students | Bearer |
| GET/PUT/DELETE | /api/students/:id | Bearer |

### Teachers
| GET/POST | /api/teachers | Bearer |
| GET/PUT/DELETE | /api/teachers/:id | Bearer |

### Assistants
| GET/POST | /api/assistants | Bearer |
| GET/PUT/DELETE | /api/assistants/:id | Bearer |

### Tasks (Manager only)
| GET | /api/tasks | Bearer |
| POST/PUT/DELETE | /api/tasks, /api/tasks/:id | Bearer+Manager |

### Payments (Manager only)
| GET | /api/payments | Bearer+Manager |
| GET | /api/payments/stats | Bearer+Manager |
| POST | /api/payments | Bearer+Manager |
| PUT | /api/payments/:id/toggle | Bearer+Manager |

### Student Results
| GET | /api/results | Bearer |
| GET | /api/results/subjects | Bearer |
| GET | /api/results/student/:id | Bearer |
| POST | /api/results | Bearer |

### Attendance
| GET/POST | /api/attendance | Bearer |
| GET | /api/attendance/stats | Bearer |

### Daily Topics
| GET/POST | /api/topics | Bearer |

### Timetable
| GET | /api/timetable | Bearer |
| PUT | /api/timetable/:day/:period | Bearer |

### Reports (Manager/Owner only)
| GET | /api/reports/overview | Bearer+Manager |
| GET | /api/reports/teacher-tasks | Bearer+Manager |
| GET | /api/reports/grade-distribution | Bearer+Manager |
| GET | /api/reports/attendance-breakdown | Bearer+Manager |

### Zakat (any authenticated user)
| GET | /api/zakat/calculate | Bearer |
| GET | /api/zakat/history | Bearer |
| POST | /api/zakat/save | Bearer |
| PUT | /api/zakat/income | Bearer |

### Settings (Manager/Owner only)
| GET | /api/settings | Bearer+Manager |
| PUT | /api/settings/:key | Bearer+Manager |

### Users (Manager/Owner only)
| GET | /api/users | Bearer+Manager |
| GET/PUT/DELETE | /api/users/:id | Bearer+Manager |
| PUT | /api/users/:id/password | Bearer+Manager |

---

## Response Format
All responses:
```json
{ "success": true,  "data": { ... } }
{ "success": false, "message": "Error description" }
```

---

## Zakat Calculation (Islamic)
- **Nisab** = 595 ETB (stored in settings, equals ~85g gold)  
- **Rate** = 2.5%  
- `is_liable` = annual_income ≥ nisab  
- `zakat_amount` = annual_income × 0.025  
- `monthly_zakat` = zakat_amount / 12  
- `net_after_zakat` = annual_income − zakat_amount
