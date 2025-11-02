"use client";
import DialogCreateButton from "@/components/dialog-create-button";
import DialogJoinButton from "@/components/dialog-join-button";
import EditorPanel from "@/components/editor-panel";
import Header from "@/components/header";
import InputPanel from "@/components/input-panel";
import OutputPanel from "@/components/output-panel";
import ParticipantsPanel from "@/components/participants-panel";
import RoomIdDisplay from "@/components/room-id-display";
import { useRoomId } from "@/lib/providers/roomId-provider";
import { useState } from "react";

export default function Home() {

  const [isPanelOpen, setIsPanelOpen ] = useState(false)
  const {roomId} = useRoomId()

  return (
    <div className="flex h-screen flex-col ">
      <Header isPanelOpen={isPanelOpen} setIsPanelOpen={setIsPanelOpen} />

      <div className="relative flex-1 min-h-0" >
        <div
          className="fixed inset-0 -z-1"
          style={{
            background: "radial-gradient(125% 125% at 50% 100%, #000000 40%, #101f3f 100%)",
          }}
        />
        <main className="h-full padding flex flex-col lg:flex-row gap-4" >
          {roomId 
          ? <div className="md:hidden">
              <RoomIdDisplay roomId={roomId}></RoomIdDisplay> 
            </div>
          : <div className="mb-4 space-x-4 mx-auto md:hidden" >
              <DialogCreateButton></DialogCreateButton>
              <DialogJoinButton></DialogJoinButton>
            </div>
          }
          <section className="lg:w-[50%] max-lg:min-h-[80vh]" >
            <EditorPanel></EditorPanel>
          </section>
          <section className="flex-1 flex flex-col gap-4">
            <InputPanel></InputPanel>
            <OutputPanel></OutputPanel>
          </section>
      </main>

      </div>

      {roomId &&
        <ParticipantsPanel isPanelOpen={isPanelOpen} setIsPanelOpen={setIsPanelOpen} />
      }
    </div>
  );
}
