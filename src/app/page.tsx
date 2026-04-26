import { auth } from "@clerk/nextjs/server";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background px-6">
      <section className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-foreground">
          FlashyCardy
        </h1>
        <p className="text-lg text-muted-foreground">
          your personal flashcard learning platform
        </p>
        <div className="flex items-center justify-center gap-4">
          <SignInButton
            mode="modal"
            forceRedirectUrl="/dashboard"
            fallbackRedirectUrl="/dashboard"
          >
            <Button className="rounded-full px-6">Sign In</Button>
          </SignInButton>
          <SignUpButton
            mode="modal"
            forceRedirectUrl="/dashboard"
            fallbackRedirectUrl="/dashboard"
          >
            <Button variant="outline" className="rounded-full px-6">
              Sign Up
            </Button>
          </SignUpButton>
        </div>
      </section>
    </main>
  );
}
