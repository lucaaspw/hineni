import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

interface TokenPayload {
  username: string;
  role: string;
  iat: number;
  exp: number;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Token não encontrado" },
        { status: 401 }
      );
    }

    // Verificar o token
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

    if (!decoded || !decoded.username) {
      return NextResponse.json({ message: "Token inválido" }, { status: 401 });
    }

    return NextResponse.json(
      {
        message: "Token válido",
        user: {
          username: decoded.username,
          role: decoded.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro na verificação:", error);
    return NextResponse.json({ message: "Token inválido" }, { status: 401 });
  }
}
