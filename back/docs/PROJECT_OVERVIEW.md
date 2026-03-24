# sport-zone

**sport-zone** is a multi-sport social and competitive platform where players can form teams, 
schedule matches, rate players and sports facilities, and manage reservations — all in one place.

The goal is to create a flexible environment for sports communities to organize games, communicate, 
and track performance across multiple sports.

---

## 🚀 Overview

sport-zone enables:
- Forming and joining teams  
- Scheduling and participating in matches  
- Rating players and sports fields/halls  
- Reserving and managing sports facilities  
- Communicating with other players for match participation  

It supports different user roles and permissions:
- **Player:** joins teams, plays matches, rates players and fields  
- **Team Admin:** manages teams, matches, and invitations  
- **Field/Hall Owner:** manages facility reservations and rates teams  

---

## 🧩 Core Features

### 👥 Users
- Register, login, logout  
- Edit profile (name, email, phone, sports interests)  
- View other profiles  
- Rate other players after matches (1–10 scale)

### 🏆 Teams
- Create teams and assign admins  
- Add/remove team members  
- Search and invite players  
- Accept or reject match participation requests  

### ⚽ Matches
- Schedule matches (date, time, location, participants)  
- Manage participation and invitations  

### ⭐ Ratings
- Rate players per match (1–10)  
- Rate sports fields/halls (1–10)  
- Field/hall owners can rate teams (responsibility, punctuality, no-shows)

### 🏟️ Sports Fields / Halls
- Register facilities (name, location, sport type, hours)  
- Manage reservations and availability  
- Accept/reject booking requests  

### 💬 Communication & Notifications
- Email and WhatsApp integration (via Twilio + SMTP)  
- Notifications for match invites, reservation updates, and team requests  

---

## 🧠 Data Model (Conceptual)

Main entities and relationships:
- `User` → extended with profile and role information  
- `Team` → has admin and members  
- `Match` → linked to team, field, participants  
- `Field` → owned by user, includes availability and reservations  
- `PlayerRating`, `FieldRating`, `TeamRatingByHall` → store feedback data  
- `Reservation` → connects teams and fields with statuses  

---

## 🛠️ Tech Stack

| Layer | Technology                            |
|-------|---------------------------------------|
| Backend | **Django**, **Django REST Framework** |
| Frontend | TBA                                   |
| Database | **PostgreSQL**                        |
| Messaging | TBA                                   |
| Hosting | **Heroku**                |

---
