import { Monaco } from "@monaco-editor/react";
import { editor } from 'monaco-editor';
import { tokyoNightTheme } from "./tokyo-night";

const THEME_DEFINITONS: Record<string, editor.IStandaloneThemeData> = {
  "tokyo-night": tokyoNightTheme as unknown as editor.IStandaloneThemeData
};

export const defineMonacoThemes = (monaco: Monaco) => {
  Object.entries(THEME_DEFINITONS).forEach(([themeName, themeData]) => {
      monaco.editor.defineTheme(themeName, themeData);
  });
};