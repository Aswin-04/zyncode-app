'use client'
  import CodeEditor from "@/components/editor";
  import Header from "@/components/header";
  import { useCurrentUser } from "@/lib/providers/current-user";
  import { useEffect, useRef } from "react";


  export default function Home() {


    return (
      <div>
        <Header></Header>
        <CodeEditor></CodeEditor>
      </div>
    );
  }
