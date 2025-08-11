// middlewares/socketSetup.js
const { Server } = require("socket.io");
const verifyFirebaseToken = require("./firebaseAuth");
const {
  handleDesignUpdate,
  handleDesignLock,
} = require("../controllers/networkDesignController");
const rateLimit = require("socket.io-rate-limit");

module.exports = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL.split(",") || process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  // Rate limiting middleware
  io.use(
    rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 100, // Max events per window
      onExceeded: (socket) => socket.emit("rate_limit_exceeded"),
    })
  );

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication token required"));
      }

      const decoded = await verifyFirebaseToken(token);
      socket.user = {
        id: decoded.uid,
        email: decoded.email,
        name: decoded.name || "Anonymous",
      };

      // Attach session ID for tracking
      socket.sessionId = socket.id;
      next();
    } catch (err) {
      console.error(`Socket auth failed: ${err.message}`);
      next(new Error("Authentication failed"));
    }
  });

  // Connection handler
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.email} (${socket.sessionId})`);

    // Error handling wrapper
    const withErrorHandling =
      (handler) =>
      async (...args) => {
        try {
          await handler(...args);
        } catch (error) {
          console.error(`Socket error [${socket.user.email}]:`, error);
          socket.emit("socket_error", {
            event: args[0]?.type || "unknown",
            error: error.message,
          });
        }
      };

    // Design collaboration handlers
    socket.on(
      "designUpdate",
      withErrorHandling(handleDesignUpdate(io, socket))
    );

    socket.on("designLock", withErrorHandling(handleDesignLock(io, socket)));

    // Team presence
    socket.on("joinTeams", async (teamIds) => {
      if (!Array.isArray(teamIds)) {
        return socket.emit("error", "teamIds must be an array");
      }

      teamIds.forEach((teamId) => {
        if (isValidTeamId(teamId)) {
          socket.join(`team_${teamId}`);
          io.to(`team_${teamId}`).emit("member_joined", {
            userId: socket.user.id,
            email: socket.user.email,
          });
        }
      });
    });

    // Cleanup on disconnect
    socket.on("disconnect", (reason) => {
      console.log(
        `User disconnected: ${socket.user.email} (${
          reason || "unknown reason"
        })`
      );
      // Implement cleanup logic when needed
    });

    // Health check
    socket.on("ping", (cb) => cb("pong"));
  });

  // Helper function
  const isValidTeamId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

  // Socket.IO server logging
  io.of("/").adapter.on("create-room", (room) => {
    console.log(`Room created: ${room}`);
  });

  io.of("/").adapter.on("delete-room", (room) => {
    console.log(`Room deleted: ${room}`);
  });

  return io;
};
