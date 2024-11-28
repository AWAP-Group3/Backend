import express, { NextFunction } from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { Request, Response } from "express";
import cors from "cors";

import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import userRouter from "./routes/userRouter";
import groupRouter from "./routes/groupRouter";
import movieRouter from "./routes/movieRouter";

import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { absolutePath } from "swagger-ui-dist";
import ApiError from "./helpers/ApiError";
import { authenticateJWT } from "./middleware/authenticateJWT";

const app = express();
// Use CORS middleware
app.use(
  cors({
    origin: ["http://localhost:5174", "http://localhost:5173"], // Genau das Frontend, das Zugriff benötigt
    credentials: true, //
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type",
  })
);

const port = 3000;

const pathToSwaggerUi = absolutePath();

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "My API",
      version: "1.0.0",
      description: "Automatically generated API documentation",
    },
  },
  apis: ["./routes/*.ts"], // Path to your route files
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Serve the Swagger UI at /docs
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(morgan("dev"));
app.use(express.json());
app.use(helmet());
app.use(cookieParser());

// Get the directory name in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the 'uploads' directory
app.use(
  "/uploads",
  (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // Erlaubt alle Domains (oder spezifische Frontend-Domain)
    res.header("Cross-Origin-Resource-Policy", "cross-origin"); // Erlaubt Cross-Origin-Nutzung
    next();
  },
  express.static(path.join(__dirname, "../uploads"))
);

app.use(express.static(pathToSwaggerUi));
app.use("/user", userRouter);
app.use("/groups", groupRouter); // Set /groups as the base URL for group routes
app.use("/movie", authenticateJWT, movieRouter);

// app.get("/me", authenticateJWT, (req, res) => {
//   console.log("GET /me runs!");
//   const { userId, email } = req.user; // Decoded JWT payload
//   res.json({ userId, email });
// });

// to handle requests to the endpoints that does not exist
//important to place this after all routes since if this runs
//it means there is no route matched and we return 404
app.use((req: Request, res: Response, next: NextFunction) => {
  const err = new ApiError("Route Not Found", 404);
  next(err); // Pass the error to the error-handling middleware
});

app.use((err: ApiError, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ error: err.message });
});

app.listen(port, () => {
  console.log(`App started listening on port ${port}`);
});
