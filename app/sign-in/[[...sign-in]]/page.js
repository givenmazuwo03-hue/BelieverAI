import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{ background: "#1B2430" }}>
      <SignIn />
    </div>
  );
}
