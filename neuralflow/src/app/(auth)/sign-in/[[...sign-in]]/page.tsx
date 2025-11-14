import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default function SignInPage() {
  const { userId } = auth();
  if (userId) {
    redirect("/todos");
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl="/todos"
        fallbackRedirectUrl="/todos"
      />
    </div>
  );
}
