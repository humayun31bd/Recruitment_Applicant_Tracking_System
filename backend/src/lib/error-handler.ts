import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode = 400, code = "BAD_REQUEST") {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, error: { code: error.code, message: error.message } },
      { status: error.statusCode }
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: { code: "DUPLICATE_ENTRY", message: "A record with this identifier already exists." } },
        { status: 409 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Resource not found." } },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: "DATABASE_ERROR", message: "A database error occurred." } },
      { status: 500 }
    );
  }

  console.error("[Unhandled Error]:", error);
  return NextResponse.json(
    { success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred." } },
    { status: 500 }
  );
}
