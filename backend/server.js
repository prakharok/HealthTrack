const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "healthtrack-secret";

/* =========================
   USER
========================= */

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    age: Number,
    height: Number,
    weight: Number
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);


/* =========================
   HEALTH LOG
========================= */

const logSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false
    },

    date: {
      type: String,
      required: true
    },

    steps: {
      type: Number,
      default: 0
    },

    water: {
      type: Number,
      default: 0
    },

    sleep: {
      type: Number,
      default: 0
    },

    calories: {
      type: Number,
      default: 0
    },

    mood: {
      type: String,
      default: "Good"
    },

    notes: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

const HealthLog = mongoose.model("HealthLog", logSchema);


/* =========================
   DEMO DATA
========================= */

const demoLogs = [
  {
    date: new Date().toISOString().slice(0, 10),
    steps: 8420,
    water: 6.5,
    sleep: 7.4,
    calories: 1980,
    mood: "Great",
    notes: "Morning walk"
  },
  {
    date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    steps: 10120,
    water: 7.2,
    sleep: 8,
    calories: 2150,
    mood: "Good",
    notes: "Gym session"
  },
  {
    date: new Date(Date.now() - 172800000).toISOString().slice(0, 10),
    steps: 7310,
    water: 5.5,
    sleep: 6.8,
    calories: 2070,
    mood: "Good",
    notes: "Busy day"
  },
  {
    date: new Date(Date.now() - 259200000).toISOString().slice(0, 10),
    steps: 9320,
    water: 6.8,
    sleep: 7.6,
    calories: 2010,
    mood: "Great",
    notes: "Evening walk"
  },
  {
    date: new Date(Date.now() - 345600000).toISOString().slice(0, 10),
    steps: 6840,
    water: 5,
    sleep: 6.5,
    calories: 2240,
    mood: "Okay",
    notes: "Rest day"
  },
  {
    date: new Date(Date.now() - 432000000).toISOString().slice(0, 10),
    steps: 11420,
    water: 8,
    sleep: 8.1,
    calories: 2180,
    mood: "Great",
    notes: "Long walk"
  },
  {
    date: new Date(Date.now() - 518400000).toISOString().slice(0, 10),
    steps: 7900,
    water: 6,
    sleep: 7.2,
    calories: 2050,
    mood: "Good",
    notes: "Normal routine"
  }
];


/* =========================
   AUTH MIDDLEWARE
========================= */

function auth(req, res, next) {
  const header = req.headers.authorization || "";

  const token = header.startsWith("Bearer ")
    ? header.substring(7)
    : "";

  if (!token) {
    return next();
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
  } catch {
    req.user = null;
  }

  next();
}


/* =========================
   HEALTH CHECK
========================= */

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "HealthTrack API",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "demo-mode"
  });
});


/* =========================
   REGISTER
========================= */

app.post("/api/auth/register", async (req, res) => {
  try {
    let { name, email, password } = req.body;

    name = String(name || "").trim();
    email = String(email || "").trim().toLowerCase();
    password = String(password || "");

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required"
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(201).json({
        token: "demo-token",
        user: {
          name,
          email
        }
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email
      },
      JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      message: "Registration failed"
    });
  }
});


/* =========================
   LOGIN
========================= */

app.post("/api/auth/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    email = String(email || "").trim().toLowerCase();
    password = String(password || "");

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    /* Demo mode */
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        token: "demo-token",
        user: {
          name: "Prakhar",
          email
        }
      });
    }

    const user = await User.findOne({ email });

    /* User doesn't exist */
    if (!user) {
      return res.status(401).json({
        message: "Account not found. Please create an account first."
      });
    }

    let passwordCorrect = false;

    /*
      Normal bcrypt password
    */
    if (
      typeof user.password === "string" &&
      user.password.startsWith("$2")
    ) {
      passwordCorrect = await bcrypt.compare(
        password,
        user.password
      );
    }

    /*
      Compatibility with an old account that may have
      stored the password without bcrypt.
    */
    if (!passwordCorrect && user.password === password) {
      passwordCorrect = true;

      user.password = await bcrypt.hash(password, 10);
      await user.save();
    }

    if (!passwordCorrect) {
      return res.status(401).json({
        message: "Incorrect email or password."
      });
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email
      },
      JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      message: "Login failed"
    });
  }
});


/* =========================
   GET HEALTH LOGS
========================= */

app.get("/api/logs", auth, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json(demoLogs);
    }

    const filter = req.user?.id
      ? { userId: req.user.id }
      : {};

    const logs = await HealthLog.find(filter)
      .sort({ date: -1 })
      .limit(90);

    return res.json(logs);

  } catch (error) {
    console.error("GET LOGS ERROR:", error);

    return res.status(500).json({
      message: "Could not load health logs"
    });
  }
});


/* =========================
   ADD HEALTH LOG
========================= */

app.post("/api/logs", auth, async (req, res) => {
  try {
    const data = {
      date:
        req.body.date ||
        new Date().toISOString().slice(0, 10),

      steps: Number(req.body.steps) || 0,

      water: Number(req.body.water) || 0,

      sleep: Number(req.body.sleep) || 0,

      calories: Number(req.body.calories) || 0,

      mood: req.body.mood || "Good",

      notes: req.body.notes || ""
    };

    if (mongoose.connection.readyState !== 1) {
      return res.status(201).json(data);
    }

    if (req.user?.id) {
      data.userId = req.user.id;
    }

    const log = await HealthLog.create(data);

    return res.status(201).json(log);

  } catch (error) {
    console.error("ADD LOG ERROR:", error);

    return res.status(400).json({
      message: "Could not save health log"
    });
  }
});


/* =========================
   UPDATE HEALTH LOG
========================= */

app.put("/api/logs/:id", auth, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        ...req.body,
        _id: req.params.id
      });
    }

    const log = await HealthLog.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true
      }
    );

    if (!log) {
      return res.status(404).json({
        message: "Health log not found"
      });
    }

    return res.json(log);

  } catch (error) {
    console.error("UPDATE LOG ERROR:", error);

    return res.status(400).json({
      message: "Could not update health log"
    });
  }
});


/* =========================
   DELETE HEALTH LOG
========================= */

app.delete("/api/logs/:id", auth, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        message: "Demo mode"
      });
    }

    const log = await HealthLog.findByIdAndDelete(
      req.params.id
    );

    if (!log) {
      return res.status(404).json({
        message: "Health log not found"
      });
    }

    return res.json({
      message: "Deleted"
    });

  } catch (error) {
    console.error("DELETE LOG ERROR:", error);

    return res.status(400).json({
      message: "Could not delete health log"
    });
  }
});


/* =========================
   MONGODB
========================= */

const mongoURI =
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/healthtrack";

mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.log(
      "MongoDB unavailable — HealthTrack demo mode"
    );
    console.log(error.message);
  });


/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `HealthTrack API running at http://localhost:${PORT}`
  );
});