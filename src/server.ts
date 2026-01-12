import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { config } from "./config.ts";

export const app = new Elysia().use(cors()).get("/", "Hello World");
