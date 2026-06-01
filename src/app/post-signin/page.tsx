import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function PostSignIn() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  const role = session.user.role;
  redirect(role === "TEAM" || role === "ADMIN" ? "/team" : "/desk");
}
