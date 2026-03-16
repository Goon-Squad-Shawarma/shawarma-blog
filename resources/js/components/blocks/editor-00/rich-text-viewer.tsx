import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { SerializedEditorState } from 'lexical'

import { editorTheme } from '@/components/editor/themes/editor-theme'
import { nodes } from './nodes'

export function RichTextViewer({ content }: { content: string }) {
  let serializedState: SerializedEditorState | null = null

  try {
    serializedState = JSON.parse(content)
  } catch {
    return <div className="whitespace-pre-wrap text-foreground leading-relaxed">{content}</div>
  }

  return (
    <LexicalComposer
      initialConfig={{
        namespace: 'RichTextViewer',
        theme: editorTheme,
        nodes,
        editable: false,
        editorState: JSON.stringify(serializedState),
        onError: (error: Error) => console.error(error),
      }}
    >
      <RichTextPlugin
        contentEditable={
          <ContentEditable className="prose prose-sm dark:prose-invert max-w-none focus:outline-none" />
        }
        placeholder={null}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <ListPlugin />
      <CheckListPlugin />
      <LinkPlugin />
    </LexicalComposer>
  )
}

