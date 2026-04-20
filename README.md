🚀 CodeAlpha Backend Development Internship — Module 1
 
> Three backend projects built with **Node.js**, **Express.js**, and **SQLite** as part of the CodeAlpha Backend Development Internship.
 
---
 
## 📁 Projects Overview
 
| # | Project | Port | Description |
|---|---------|------|-------------|
| 1 | URL Shortener | 3001 | Shorten long URLs and redirect with tracking |
| 2 | Event Registration System | 3002 | Manage events and user registrations |
| 3 | Restaurant Management System | 3003 | Handle menu, tables, and orders |
 
---
 
## 🛠️ Tech Stack
 
- **Runtime** — Node.js
- **Framework** — Express.js
- **Database** — SQLite (via `better-sqlite3`)
- **Architecture** — REST API
---
 
## ⚙️ Installation & Setup
 
### Prerequisites
- Node.js v18+ installed
- npm installed
### Run any task
 
```bash
# Clone the repo
git clone https://github.com/MuthuAyyanar21/codealpha-url-shortener.git
cd codealpha-url-shortener
 
# Install dependencies
npm install
 
# Start the server
npm start
 
# Development mode (auto-restart)
npm run dev
```
 
> SQLite database file is created automatically on first run. No extra database setup needed.
 
---
 
## ✅ Task 1 — Simple URL Shortener
 
### Features
- Shorten any valid long URL into a unique short code
- Redirect short URL → original URL
- Track visit count per short link
- View stats for any short code
- Basic frontend UI included
### API Endpoints
 
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Frontend UI |
| `POST` | `/api/shorten` | Create a short URL |
| `GET` | `/:code` | Redirect to original URL |
| `GET` | `/api/stats/:code` | Get stats for a short code |
| `GET` | `/api/all` | List all shortened URLs |
 
### Example
 
```bash
# Shorten a URL
curl -X POST http://localhost:3001/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.example.com/very/long/url/here"}'
 
# Response
{
  "short_code": "a3f9c2b1",
  "short_url": "http://localhost:3001/a3f9c2b1",
  "original_url": "https://www.example.com/very/long/url/here"
}
```
 
---
 
## ✅ Task 2 — Event Registration System
 
### Features
- User registration and login with roles (`organizer` / `attendee`)
- Organizers can create, update, and delete events
- Attendees can register and cancel event registrations
- Capacity enforcement — no overbooking allowed
- View full attendee list per event
### API Endpoints
 
**Users**
 
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/users/register` | Register a new user |
| `POST` | `/api/users/login` | Login |
 
**Events**
 
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/events` | List all events |
| `GET` | `/api/events/:id` | Event details |
| `POST` | `/api/events` | Create event (organizer only) |
| `PUT` | `/api/events/:id` | Update event (organizer only) |
| `DELETE` | `/api/events/:id` | Delete event (organizer only) |
 
**Registrations**
 
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/registrations` | Register for an event |
| `DELETE` | `/api/registrations/:id` | Cancel registration |
| `GET` | `/api/users/:id/registrations` | View user's registrations |
| `GET` | `/api/events/:id/registrations` | View event's attendees |
 
### Example
 
```bash
# Register an organizer
curl -X POST http://localhost:3002/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@mail.com","password":"secret","role":"organizer"}'
 
# Create an event
curl -X POST http://localhost:3002/api/events \
  -H "Content-Type: application/json" \
  -d '{"title":"Tech Meetup","event_date":"2025-09-01","organizer_id":1,"capacity":50}'
 
# Register an attendee
curl -X POST http://localhost:3002/api/registrations \
  -H "Content-Type: application/json" \
  -d '{"user_id":2,"event_id":1}'
```
 
---
 
## ✅ Task 3 — Restaurant Management System
 
### Features
- Menu management with categories (CRUD)
- Table management with real-time status (`free` / `occupied` / `reserved`)
- Order creation with multiple items in one request
- Order status workflow: `pending → in-progress → served → paid`
- Table auto-freed when order is marked as paid
- Add items to an existing active order
- Daily sales revenue report
### API Endpoints
 
**Menu & Categories**
 
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/categories` | List categories |
| `POST` | `/api/categories` | Add a category |
| `GET` | `/api/menu` | List menu items (filter: `?category_id=&available=true`) |
| `GET` | `/api/menu/:id` | Single item detail |
| `POST` | `/api/menu` | Add a menu item |
| `PUT` | `/api/menu/:id` | Update a menu item |
| `DELETE` | `/api/menu/:id` | Delete a menu item |
 
**Tables**
 
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tables` | List all tables with status |
| `PUT` | `/api/tables/:id/status` | Update table status |
 
**Orders**
 
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/orders` | List all orders (filter: `?status=pending`) |
| `GET` | `/api/orders/:id` | Order detail with items |
| `POST` | `/api/orders` | Create a new order |
| `PUT` | `/api/orders/:id/status` | Update order status |
| `POST` | `/api/orders/:id/items` | Add item to existing order |
 
**Reports**
 
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reports/sales` | Daily sales summary |
 
### Example
 
```bash
# Add a menu item
curl -X POST http://localhost:3003/api/menu \
  -H "Content-Type: application/json" \
  -d '{"name":"Margherita Pizza","price":12.99,"category_id":2}'
 
# Create an order for table 1
curl -X POST http://localhost:3003/api/orders \
  -H "Content-Type: application/json" \
  -d '{"table_id":1,"items":[{"menu_item_id":1,"quantity":2}]}'
 
# Mark order as paid
curl -X PUT http://localhost:3003/api/orders/1/status \
  -H "Content-Type: application/json" \
  -d '{"status":"paid"}'
```
 
---
 
## 📂 Project Structure
 
```
backend-project/
├── task1-url-shortener/
│   ├── server.js        # Express server + all routes
│   ├── package.json
│   └── urls.db          # Auto-generated SQLite DB
│
├── task2-event-registration/
│   ├── server.js
│   ├── package.json
│   └── events.db
│
└── task3-restaurant-management/
    ├── server.js
    ├── package.json
    └── restaurant.db
```
 
---
 
## 👤 Author
 
**Muthu Ayyanar**
- GitHub: [@MuthuAyyanar21](https://github.com/MuthuAyyanar21)
---
 
## 📝 License
 
This project was built as part of the **CodeAlpha Backend Development Internship**.
