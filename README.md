# IronRealm: 3D Online Sandbox

IronRealm is a persistent, multiplayer 3D sandbox game built with Node.js, Three.js, and MongoDB. Inspired by the mechanics of Albion Online, it features real-time interaction, gathering, crafting, and persistent progression.

## 🚀 Features

- **Multiplayer World:** See and interact with other players in a shared 3D space via WebSockets (Socket.io).
- **Persistent Progress:** Player stats, inventories, and equipment are saved to **MongoDB Atlas**.
- **Gathering System:** Chop trees and mine rocks. Includes a progress bar and tool requirements (e.g., you need an axe to chop wood).
- **Crafting & Gear Tiers:** Collect raw materials to craft higher-tier weapons and armor (Iron, Steel, Mithril).
- **Full-Loot PvP Mechanics:** Dangerous "Black Zones" where dying means losing your gear, balanced by safe "Blue Zones."
- **Admin Dashboard:** A real-time interface for admins to monitor the player base.

## 🛠 Tech Stack

- **Frontend:** Three.js (3D Graphics), Vanilla JavaScript, CSS3.
- **Backend:** Node.js, Express.js, Socket.io.
- **Database:** MongoDB Atlas (Mongoose ODM).
- **Security:** JWT (JSON Web Tokens) for sessions, Bcrypt for password hashing.

## 📦 Setup & Installation

### 1. Local Development
1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ironrealm.git
   cd ironrealm