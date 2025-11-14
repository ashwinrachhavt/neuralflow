import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default function SignUpPage() {
  const { userId } = auth();
  if (userId) {
    redirect("/todos");
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        afterSignUpUrl="/todos"
        afterSignInUrl="/todos"
        fallbackRedirectUrl="/todos"
      />
    </div>
  );
}
