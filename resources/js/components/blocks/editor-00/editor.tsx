import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { $generateNodesFromDOM } from "@lexical/html"
import { $getRoot, $insertNodes, EditorState, LexicalEditor, SerializedEditorState } from "lexical"

import { editorTheme } from "@/components/editor/themes/editor-theme"
import { TooltipProvider } from "@/components/ui/tooltip"

import { nodes } from "./nodes"
import { Plugins } from "./plugins"

const buildInitialConfig = (
  editorState?: EditorState,
  editorSerializedState?: SerializedEditorState,
  initialHtml?: string,
): InitialConfigType => ({
  namespace: "Editor",
  theme: editorTheme,
  nodes,
  onError: (error: Error) => {
    console.error(error)
  },
  ...(editorState ? { editorState } : {}),
  ...(editorSerializedState
    ? { editorState: JSON.stringify(editorSerializedState) }
    : {}),
  ...(initialHtml && !editorState && !editorSerializedState
    ? {
        editorState: (editor: LexicalEditor) => {
          const parser = new DOMParser()
          const dom = parser.parseFromString(initialHtml, "text/html")
          const htmlNodes = $generateNodesFromDOM(editor, dom)
          $getRoot().select()
          $insertNodes(htmlNodes)
        },
      }
    : {}),
})

export function Editor({
  editorState,
  editorSerializedState,
  onChange,
  onSerializedChange,
  initialHtml,
  editorKey,
}: {
  editorState?: EditorState
  editorSerializedState?: SerializedEditorState
  onChange?: (editorState: EditorState) => void
  onSerializedChange?: (editorSerializedState: SerializedEditorState) => void
  initialHtml?: string
  editorKey?: string | number
}) {
  return (
    <div className="bg-background flex h-full flex-col overflow-hidden rounded-lg border shadow">
      <LexicalComposer
        key={editorKey}
        initialConfig={buildInitialConfig(editorState, editorSerializedState, initialHtml)}
      >
        <TooltipProvider>
          <Plugins />

          <OnChangePlugin
            ignoreSelectionChange={true}
            onChange={(editorState) => {
              onChange?.(editorState)
              onSerializedChange?.(editorState.toJSON())
            }}
          />
        </TooltipProvider>
      </LexicalComposer>
    </div>
  )
}
