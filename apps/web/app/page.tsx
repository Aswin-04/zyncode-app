"use client"

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>()
  return (
    <div>
      <Button
      variant="outline"
      onClick={() =>
        toast("Event has been created", {
          description: "Sunday, December 03, 2023 at 9:00 AM",
          action: {
            label: "Undo",
            onClick: () => console.log("Undo"),
          },
        })
      }
      >
      Show Toast
      </Button>
      <Button>Signup</Button>
      <Button>Login</Button>
      <Button>Logout</Button>
    </div>
  );
}
