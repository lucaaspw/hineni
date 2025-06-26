import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Credenciais fixas conforme especificado
    const validUsername = "hineni";
    const validPassword = "hineni25";

    if (username === validUsername && password === validPassword) {
      // Gerar token JWT
      const token = jwt.sign({ username, role: "admin" }, JWT_SECRET, {
        expiresIn: "24h",
      });

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
