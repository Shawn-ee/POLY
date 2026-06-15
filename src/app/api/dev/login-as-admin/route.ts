import { NextResponse } from "next/server";
import {
  ensurePlaywrightAdminUser,
  getPlaywrightAdminCredentials,
  isDevLoginAllowed,
} from "@/lib/devLogin";
import { setUserIdCookie } from "@/lib/auth";

export async function POST(request: Request) {
  // This route is intentionally local-development only. It must never be enabled
  // in production and still requires the caller to opt in with ALLOW_DEV_LOGIN=true.
  if (!isDevLoginAllowed()) {
    return NextResponse.json({ error: "Dev login is disabled." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const { email, password } = getPlaywrightAdminCredentials();

  if (body?.email !== email || body?.password !== password) {
    return NextResponse.json({ error: "Invalid dev login credentials." }, { status: 401 });
  }

  const user = await ensurePlaywrightAdminUser(email);
  await setUserIdCookie(user.id);

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      isAdmin: user.isAdmin,
    },
  });
}
