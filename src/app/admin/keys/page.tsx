import { redirect } from "next/navigation";

// API key management now lives inside Settings. Keep this route as a
// permanent redirect so old links/bookmarks still work.
export default function ApiKeysRedirect() {
  redirect("/admin/settings");
}
