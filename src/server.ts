import express, { NextFunction } from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { Request, Response } from "express";

import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import userRouter from "./routes/userRouter";
import groupRouter from "./routes/groupRouter";
import morgan from "morgan";
const app = express();
const port = 3000;

import { absolutePath } from "swagger-ui-dist";
import ApiError from "./helpers/ApiError";
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

app.use(express.static(pathToSwaggerUi));
app.use("/user", userRouter);
app.use("/", groupRouter);

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
