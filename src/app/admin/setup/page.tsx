import { redirect } from "next/navigation";

export default function SetupAdmin() {
  // Setup file has been disabled for security.
  redirect("/admin/login");
}
