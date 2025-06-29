import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { AUTH_CONFIG, verifyCredentials } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar dados com Zod
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: "Dados inválidos",
          errors: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { username, password } = validationResult.data;

    if (verifyCredentials(username, password)) {
      // Gerar token JWT
      const token = jwt.sign(
        { username, role: "admin" },
        AUTH_CONFIG.jwtSecret,
        {
          expiresIn: AUTH_CONFIG.tokenExpiry,
        }
      );

      const response = NextResponse.json(
        { message: "Login realizado com sucesso" },
        { status: 200 }
      );

      // Definir cookie com o token
      response.cookies.set("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60, // 24 horas
      });

      return response;
    }

    return NextResponse.json(
      { message: "Credenciais inválidas" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
