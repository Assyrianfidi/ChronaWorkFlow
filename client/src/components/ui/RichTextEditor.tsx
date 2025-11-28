import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { cn } from '../../lib/utils';
import { useEffect } from 'react';

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  error?: string;
};

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write something...',
  className,
  readOnly = false,
  error,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content: value,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none p-4',
          'min-h-[200px] max-w-none',
          readOnly ? 'bg-gray-50' : 'bg-white',
          error ? 'border border-red-500 rounded' : 'border rounded',
          className
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div className="w-full">
      <EditorContent editor={editor} placeholder={placeholder} />
      {error && (
        <p className="mt-1 text-sm font-medium text-red-500">{error}</p>
      )}
    </div>
  );
}

export default RichTextEditor;
