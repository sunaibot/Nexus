import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Highlight from '@tiptap/extension-highlight'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Undo,
  Redo,
  Highlighter,
  Type
} from 'lucide-react'

const lowlight = createLowlight(common)

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  minHeight?: string
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null

  const buttonClass = (isActive: boolean) =>
    `p-2 rounded-lg transition-all ${
      isActive
        ? 'bg-primary/20 text-primary'
        : 'hover:bg-white/5 text-white/60 hover:text-white'
    }`

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-white/10 bg-white/5">
      {/* 历史记录 */}
      <div className="flex items-center gap-1 pr-2 border-r border-white/10">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={buttonClass(false)}
          title="撤销"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={buttonClass(false)}
          title="重做"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>

      {/* 文本样式 */}
      <div className="flex items-center gap-1 px-2 border-r border-white/10">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={buttonClass(editor.isActive('bold'))}
          title="粗体"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={buttonClass(editor.isActive('italic'))}
          title="斜体"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={buttonClass(editor.isActive('strike'))}
          title="删除线"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={buttonClass(editor.isActive('highlight'))}
          title="高亮"
        >
          <Highlighter className="w-4 h-4" />
        </button>
      </div>

      {/* 标题 */}
      <div className="flex items-center gap-1 px-2 border-r border-white/10">
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={buttonClass(editor.isActive('heading', { level: 1 }))}
          title="标题 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={buttonClass(editor.isActive('heading', { level: 2 }))}
          title="标题 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={buttonClass(editor.isActive('heading', { level: 3 }))}
          title="标题 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>
      </div>

      {/* 列表 */}
      <div className="flex items-center gap-1 px-2 border-r border-white/10">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={buttonClass(editor.isActive('bulletList'))}
          title="无序列表"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={buttonClass(editor.isActive('orderedList'))}
          title="有序列表"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={buttonClass(editor.isActive('taskList'))}
          title="任务列表"
        >
          <CheckSquare className="w-4 h-4" />
        </button>
      </div>

      {/* 其他 */}
      <div className="flex items-center gap-1 pl-2">
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={buttonClass(editor.isActive('blockquote'))}
          title="引用"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={buttonClass(editor.isActive('codeBlock'))}
          title="代码块"
        >
          <Code className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          className={buttonClass(false)}
          title="清除格式"
        >
          <Type className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default function TiptapEditor({
  content,
  onChange,
  placeholder = '开始输入...',
  minHeight = '200px'
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false
      }),
      TextStyle,
      Color,
      TaskList.configure({
        HTMLAttributes: {
          class: 'not-prose pl-2'
        }
      }),
      TaskItem.configure({
        HTMLAttributes: {
          class: 'flex items-start gap-2'
        },
        nested: true
      }),
      Highlight.configure({
        multicolor: true
      }),
      CodeBlockLowlight.configure({
        lowlight
      })
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none p-4',
        style: `min-height: ${minHeight}`
      }
    }
  })

  return (
    <div className="border rounded-xl overflow-hidden bg-white/5 border-white/10">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
