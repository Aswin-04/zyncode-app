"use client";
import CodeEditor from "@/components/editor";
import Header from "@/components/header";
import IOPanel from "@/components/io-panel";

export default function Home() {
  return (
    <div>
      <Header></Header>
      <div className="flex">
        <div className=" flex-1 border-rose-500">
          <CodeEditor></CodeEditor>
        </div>
        <div className="flex-1 h-[90vh]">
          <IOPanel></IOPanel>
        </div>
      </div>
    </div>
  );
}
