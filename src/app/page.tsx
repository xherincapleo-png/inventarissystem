import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";

export default async function HomePage() {
  try {
    const session = await getAuthSession();
    if (session?.user) {
      redirect("/dashboard");
    }
  } catch (error) {
    console.error("Error reading session at HomePage:", error);
  }
  redirect("/login");
}
