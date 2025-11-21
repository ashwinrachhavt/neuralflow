import { redirect } from "next/navigation";

export default function LegacyTodoPage() {
  redirect("/todos");
}
