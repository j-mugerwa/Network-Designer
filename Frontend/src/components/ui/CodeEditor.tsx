// src/components/ui/CodeEditor.tsx
import { useRef } from "react";
import { Box } from "@mui/material";
import Editor, { Monaco } from "@monaco-editor/react";
import { useTheme } from "@mui/material/styles";

// Custom function to ensure 6-digit hex color
const toValidHexColor = (color: string): string => {
  // If already 6-digit hex, return as-is
  if (/^#[0-9A-F]{6}$/i.test(color)) return color;

  // Convert 3-digit hex to 6-digit
  if (/^#[0-9A-F]{3}$/i.test(color)) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
  }

  // Handle rgba format
  if (color.startsWith("rgba")) {
    const parts = color.match(/[\d.]+/g);
    if (parts && parts.length >= 3) {
      const r = parseInt(parts[0]).toString(16).padStart(2, "0");
      const g = parseInt(parts[1]).toString(16).padStart(2, "0");
      const b = parseInt(parts[2]).toString(16).padStart(2, "0");
      return `#${r}${g}${b}`;
    }
  }

  // Fallback to white
  return "#ffffff";
};

interface CodeEditorProps {
  value: string;
  //onChange: (value: string) => void;
  onChange?: (value: string) => void;
  language?: string;
  height?: string;
  width?: string;
  readOnly?: boolean;
}

const CodeEditor = ({
  value,
  onChange,
  language = "text",
  height = "300px",
  width = "100%",
  readOnly = false,
}: CodeEditorProps) => {
  const theme = useTheme();
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;

    // Configure syntax highlighting for template variables
    monaco.languages.register({ id: "template-language" });
    monaco.languages.setMonarchTokensProvider("template-language", {
      defaultToken: "",
      tokenizer: {
        root: [[/\{\{[^{}]+\}\}/, "template-variable"]],
      },
    });

    // Define theme with validated colors
    monaco.editor.defineTheme("network-designer-theme", {
      base: theme.palette.mode === "dark" ? "vs-dark" : "vs",
      inherit: true,
      rules: [
        {
          token: "template-variable",
          foreground: "#FF5722", // 6-digit hex
          fontStyle: "bold",
        },
      ],
      colors: {
        "editor.background": toValidHexColor(theme.palette.background.paper),
        "editor.foreground": toValidHexColor(theme.palette.text.primary),
        "editorLineNumber.foreground": toValidHexColor(
          theme.palette.text.secondary
        ),
        "editor.selectionBackground": toValidHexColor(
          theme.palette.action.selected
        ),
      },
    });

    // Apply the theme after definition
    monaco.editor.setTheme("network-designer-theme");
  };

  const handleEditorChange = (value: string | undefined) => {
    if (onChange) {
      // Only call onChange if it exists
      onChange(value || "");
    }

    //onChange(value || "");
  };

  return (
    <Box
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        overflow: "hidden",
        position: "relative",
        width,
      }}
    >
      <Editor
        height={height}
        defaultLanguage={language}
        language={language === "template" ? "template-language" : language}
        value={value}
        //onChange={handleEditorChange}
        onChange={readOnly ? undefined : handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          wordWrap: "on",
          automaticLayout: true,
          theme: "network-designer-theme",
        }}
        beforeMount={(monaco) => {
          // Initialize monaco instance with empty theme
          monaco.editor.defineTheme("network-designer-theme", {
            base: theme.palette.mode === "dark" ? "vs-dark" : "vs",
            inherit: true,
            rules: [],
            colors: {},
          });
        }}
      />
    </Box>
  );
};

export default CodeEditor;
