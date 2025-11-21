import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { GooeyText } from "@/components/ui/gooey-text-morphing";

export default async function SignInPage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-muted/30 px-4 py-12">
      <div className="w-full max-w-4xl">
        <GooeyText
          texts={["Dao", "Focus is Flow"]}
          morphTime={1.2}
          cooldownTime={0.35}
          textClassName="font-semibold tracking-tight text-5xl md:text-7xl"
        />
      </div>
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl="/dashboard"
        fallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
