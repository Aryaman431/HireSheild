import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-3.5rem)] py-12">
      <SignIn />
    </div>
  );
}
