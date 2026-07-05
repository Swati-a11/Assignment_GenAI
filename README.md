# Readme Dual-Persona AI Chat Simulator 🚀

An interactive, full-stack MERN application simulating conversational developer mentorships with two tech figures: **Hitesh Choudhary** (creator of *Chai aur Code*, calm, conceptual mentor) and **Piyush Garg** (systems and DevOps expert, high-energy DevOps chaos genius).

The front-end design replicates the visual style of the **ReadMe.com dark mode mockup**, featuring a glowing tech grid, curved interior border frame layout, and floating glassmorphic control navigation panels.

---

## 🏗️ Architecture Overview

The application is structured into a backend Express.js server and a React (Vite) client:

```
/GenAI Assignment
├── client/                 # React Frontend (Vite, Tailwind CSS, Lucide)
├── server/                 # Express Backend (Node.js, Mongoose, Google Gen AI SDK)
├── .env                    # Root Configuration Variables
└── README.md               # Product Documentation
```

---

## 🛠️ Setup & Installation

### Prerequisite
* Node.js (v18 or higher recommended)
* MongoDB (Optional - if MongoDB is not running, the application auto-detects and falls back to a robust in-memory session store)

### 1. Root Configuration
Create a `.env` file in the root of the project (template already provided) and input your Google Gemini API Key:

```env
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/gemini-simulation-chat
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```

### 2. Backend Setup
Navigate to the `server` folder, install dependencies, and start the development server:

```bash
cd server
npm install
npm run dev
```

The server will start running at `http://localhost:5001`.

### 3. Frontend Setup
Navigate to the `client` folder, install dependencies, and start the development server:

```bash
cd client
npm install
npm run dev
```

The client will start running at `http://localhost:5173`. Open this URL in your web browser to interact with the application.

---

## ⚙️ Engineering & Implementation Details

### 1. Persona Data Collection Methodology
To capture authentic representations of Hitesh Choudhary and Piyush Garg, public transcripts, course structures, and video introductions were analyzed to determine core speech features:
* **Hitesh Choudhary:** Emphasizes fundamental concepts over speed. Uses introductory welcoming hooks (`"Ek cup chai lelo..."`), calming phrases (`"chill maro"`, `"bohot simple hai"`), and emphasizes code modularity and structural cleanliness.
* **Piyush Garg:** High-intensity DevOps and systems-level focus. High punctuation density (`!`), DevOps terminology (`dockerize`, `latency crash`, `scale`, `containers`), and direct action-oriented coding instructions.

### 2. Prompt Engineering Strategy
We inject deep system prompts into the API calls via the official Google Gen AI SDK config parameters:
* **System Prompt Constraints:** Strict parameters are sent alongside every generation request (`config: { systemInstruction: ... }`). The prompts explicitly command the LLM never to break character and never to identify as an artificial intelligence, keeping the simulator highly authentic.
* **Temperature Tuning:** The temperature is set to `0.7` to balance creativity (allowing natural creator banter and unique code examples) with strict rule-following (ensuring their signature styles are sustained throughout long conversations).

### 3. Context Multi-Turn Management Loops
To maintain state across multiple turns:
1. Every message sent is stored in the database (or in-memory array) under a distinct `sessionId` mapping to the persona.
2. On subsequent API calls, the backend retrieves the entire conversation log and maps it to the Gemini contents parameter:
   ```json
   [
     { "role": "user", "parts": [{ "text": "Hi Hitesh, I want to learn Node." }] },
     { "role": "model", "parts": [{ "text": "Ek cup chai lelo, aur sukoon se samajhte hain. Node.js..." }] }
   ]
   ```
3. This sequence is fed directly to the Gemini API (`gemini-2.5-flash`), allowing it to build upon code snippets and recall context from earlier turns.
4. Separate sessions are maintained for Hitesh and Piyush in the React client, ensuring no crossover context leakage.

---

## 🛡️ Database Fallback Mechanism
For developer convenience, the server features a database auto-detection system:
* **MongoDB Active:** Archiving histories to the database using Mongoose.
* **MongoDB Inactive:** History falls back to local server memory storage, keeping the app functional out-of-the-box.
