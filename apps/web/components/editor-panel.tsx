"use client";

import { useWebSocket } from "@/lib/providers/web-socket-provider";
import Editor, { OnChange } from "@monaco-editor/react";
import { useRef,  memo } from "react";
import { WSClientRequest,  } from "@repo/shared/types";
import { useEditor } from "@/lib/providers/editor-provider";
import { defineMonacoThemes } from "@/constants/themes/themes";
import { CodeXml } from "lucide-react";
import { monacoLanguage } from "@/constants/constants";
import LanguageSelector from "./language-selector";


const EditorPanel = () => {
  const { ws } = useWebSocket();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { code, setCode, language } = useEditor();


  const onChangeHandler: OnChange = (latestCode: string | undefined) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (latestCode === undefined || !ws) return;

    setCode(latestCode);

    timeoutRef.current = setTimeout(() => {
      const payload: WSClientRequest = {
        type: "codeChange",
        payload: {
          code: latestCode || "",
        },
      };
      ws.send(JSON.stringify(payload));
    }, 100);
  };

  return (
    <div className="border bg-background h-full w-full flex flex-col p-4  rounded-xl">
      <div className="flex justify-between pb-2">
        <div className="flex items-center gap-1 font-semibold">
          <CodeXml className="" />
          <span>Code</span>
        </div>
        <LanguageSelector/>
      </div>
      <div className="min-h-0 flex-1" >
        <Editor
          language={monacoLanguage[language]}
          height={"100%"}
          theme={"tokyo-night"}
          value={code}
          onChange={onChangeHandler}
          beforeMount={defineMonacoThemes}
          options={{
            minimap: { enabled: false },
            fontSize: 16,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            padding: { top: 16, bottom: 16 },
            renderWhitespace: "selection",
            fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
            fontLigatures: true,
            cursorBlinking: "smooth",
            smoothScrolling: true,
            contextmenu: true,
            renderLineHighlight: "all",
            lineHeight: 1.6,
            letterSpacing: 0.5,
            roundedSelection: true,
            scrollbar: {
              verticalScrollbarSize: 6,
              horizontalScrollbarSize: 6,
            },
          }}
        />
      </div>
    </div>
  );
};




export default memo(EditorPanel);
