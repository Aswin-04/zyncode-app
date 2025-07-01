import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-svh w-full justify-center items-center p-6 md:p-10">
      <div className="max-w-xl flex flex-col md:flex-row gap-4">
        <Link href={'/signup'}>
          <Button variant={"outline"} size={"lg"}>Signup</Button>
        </Link>
        <Link href={'/login'}>
          <Button size={"lg"}>Login</Button>
        </Link>
        <Button size={"lg"}>Logout</Button>
      </div>
    </div>
  );
}
