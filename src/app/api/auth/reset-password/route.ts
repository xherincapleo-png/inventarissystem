import "@/lib/env";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, newPassword } = body;

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: "Email dan password baru wajib diisi." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password minimal harus 6 karakter." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Akun dengan email tersebut tidak ditemukan." },
        { status: 404 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Catat log reset password
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_RESET",
        entityType: "User",
        entityId: user.id,
        details: { email: user.email },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password berhasil diperbarui! Silakan login dengan password baru.",
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan server.";
    console.error("Reset password error:", err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
