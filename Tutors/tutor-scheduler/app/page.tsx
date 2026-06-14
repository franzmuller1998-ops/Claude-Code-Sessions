import { redirect } from "next/navigation";
import { getSessionTutorId } from "@/lib/auth";

export default async function Home() {
  const tutorId = await getSessionTutorId();
  redirect(tutorId ? "/dashboard" : "/login");
}
