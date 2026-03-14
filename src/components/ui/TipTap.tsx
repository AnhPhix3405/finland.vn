"use client";

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import ListItem from '@tiptap/extension-list-item'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import Highlight from '@tiptap/extension-highlight'
import { useState, useEffect } from 'react'
import {
    Bold,
    Italic,
    Strikethrough,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Link as LinkIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
} from 'lucide-react'

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const [mounted, setMounted] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkText, setLinkText] = useState('');

    useEffect(() => {
        setMounted(true);
    }, []);

    const editor = useEditor({
        immediatelyRender: false, // Fix SSR hydration issue
        extensions: [
            StarterKit,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-500 hover:text-blue-700 hover:underline',
                },
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
                alignments: ['left', 'center', 'right', 'justify'],
                defaultAlignment: 'justify',
            }),
            Color.configure({
                types: ['textStyle'],
            }),
            TextStyle,
            ListItem,
            BulletList.configure({
                HTMLAttributes: {
                    class: 'list-disc ml-6',
                },
            }),
            OrderedList.configure({
                HTMLAttributes: {
                    class: 'list-decimal ml-6',
                },
            }),
            Highlight.configure({
                multicolor: true,
            })
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'focus:outline-none p-4 text-justify w-full',
            },
        },
    });

    const handleAddLink = () => {
        setShowLinkModal(true);
    };

    const applyLink = () => {
        if (!editor || !linkUrl || !linkText) return;

        editor.chain().focus().insertContent({
            type: 'text',
            text: linkText,
            marks: [
                {
                    type: 'link',
                    attrs: {
                        href: linkUrl,
                        target: '_blank'
                    }
                }
            ]
        }).run();

        setShowLinkModal(false);
        setLinkUrl('');
        setLinkText('');
    };

    const removeLink = () => {
        if (!editor) return;
        editor.chain().focus().unsetLink().run();
    };

    if (!mounted || !editor) {
        return (
            <div className="border rounded-lg h-96 flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">Loading editor...</div>
            </div>
        );
    }

    return (
        <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
            <style jsx>{`
        /* Custom scrollbar for editor */
        .ProseMirror {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
          font-size: 14px !important;
          line-height: 1.6 !important;
          min-height: 100% !important;
          padding: 1rem !important;
          width: 100% !important;
          max-width: none !important;
        }
        
        .ProseMirror::-webkit-scrollbar {
          width: 8px;
        }
        
        .ProseMirror::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        
        .ProseMirror::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        
        .ProseMirror::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        /* Remove prose constraints and style content directly */
        .ProseMirror * {
          max-width: none !important;
        }
        
        .ProseMirror h1 {
          font-size: 1.5rem !important;
          line-height: 1.4 !important;
          font-weight: 600 !important;
          margin: 1rem 0 0.5rem 0 !important;
        }
        
        .ProseMirror h2 {
          font-size: 1.25rem !important;
          line-height: 1.4 !important;
          font-weight: 600 !important;
          margin: 0.75rem 0 0.5rem 0 !important;
        }
        
        .ProseMirror h3 {
          font-size: 1.125rem !important;
          line-height: 1.4 !important;
          font-weight: 600 !important;
          margin: 0.75rem 0 0.5rem 0 !important;
        }
        
        .ProseMirror p {
          margin: 0.5rem 0 !important;
          text-align: justify !important;
          font-size: 14px !important;
          line-height: 1.6 !important;
        }
        
        .ProseMirror ul, .ProseMirror ol {
          margin: 0.5rem 0 !important;
          padding-left: 1.5rem !important;
        }
        
        .ProseMirror ul li {
          list-style-type: disc !important;
          margin: 0.25rem 0 !important;
        }
        
        .ProseMirror ol li {
          list-style-type: decimal !important;
          margin: 0.25rem 0 !important;
        }
        
        .ProseMirror blockquote {
          font-size: 14px !important;
          margin: 0.75rem 0 !important;
          padding: 0.5rem 1rem !important;
          border-left: 4px solid #e5e7eb !important;
          background-color: #f9fafb !important;
          font-style: italic !important;
        }
        
        /* Link styles */
        .ProseMirror a {
          color: #3b82f6 !important;
          text-decoration: none !important;
        }
        
        .ProseMirror a:hover {
          color: #1d4ed8 !important;
          text-decoration: underline !important;
        }
        
        /* Remove any max-width constraints */
        .prose {
          max-width: none !important;
        }
      `}</style>

            {/* Toolbar */}
            <div className="border-b border-gray-200 p-2 flex flex-wrap gap-1">
                {/* Headings */}
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''
                        }`}
                    title="Heading 1"
                >
                    <Heading1 className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''
                        }`}
                    title="Heading 2"
                >
                    <Heading2 className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''
                        }`}
                    title="Heading 3"
                >
                    <Heading3 className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1"></div>

                {/* Text formatting */}
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('bold') ? 'bg-gray-200' : ''
                        }`}
                    title="Bold"
                >
                    <Bold className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('italic') ? 'bg-gray-200' : ''
                        }`}
                    title="Italic"
                >
                    <Italic className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('strike') ? 'bg-gray-200' : ''
                        }`}
                    title="Strikethrough"
                >
                    <Strikethrough className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1"></div>

                {/* Lists */}
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('bulletList') ? 'bg-gray-200' : ''
                        }`}
                    title="Bullet List"
                >
                    <List className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('orderedList') ? 'bg-gray-200' : ''
                        }`}
                    title="Ordered List"
                >
                    <ListOrdered className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1"></div>

                {/* Alignment */}
                <button
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''
                        }`}
                    title="Align Left"
                >
                    <AlignLeft className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''
                        }`}
                    title="Align Center"
                >
                    <AlignCenter className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''
                        }`}
                    title="Align Right"
                >
                    <AlignRight className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                    className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: 'justify' }) || (!editor.isActive({ textAlign: 'left' }) && !editor.isActive({ textAlign: 'center' }) && !editor.isActive({ textAlign: 'right' })) ? 'bg-gray-200' : ''
                        }`}
                    title="Justify"
                >
                    <AlignJustify className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1"></div>

                {/* Quote */}
                <button
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('blockquote') ? 'bg-gray-200' : ''
                        }`}
                    title="Quote"
                >
                    <Quote className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1"></div>

                {/* Link */}
                <button
                    onClick={handleAddLink}
                    className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('link') ? 'bg-gray-200' : ''
                        }`}
                    title="Thêm liên kết"
                >
                    <LinkIcon className="w-4 h-4" />
                </button>
                {editor.isActive('link') && (
                    <button
                        onClick={removeLink}
                        className="p-2 rounded hover:bg-gray-100 text-red-600"
                        title="Xóa liên kết"
                    >
                        <span className="text-xs">✕</span>
                    </button>
                )}
            </div>

            {/* Editor Content */}
            <EditorContent
                editor={editor}
                className="h-80 overflow-y-auto"
                placeholder={placeholder || "Nhập nội dung..."}
            />

            {/* Link Modal */}
            {showLinkModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96">
                        <h3 className="text-lg font-semibold mb-4">Thêm liên kết</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Văn bản hiển thị
                                </label>
                                <input
                                    type="text"
                                    value={linkText}
                                    onChange={(e) => setLinkText(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Nhập văn bản hiển thị"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Đường dẫn URL
                                </label>
                                <input
                                    type="url"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="https://example.com"
                                />
                            </div>
                            <div className="flex justify-end space-x-2 pt-4">
                                <button
                                    onClick={() => setShowLinkModal(false)}
                                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={applyLink}
                                    disabled={!linkUrl || !linkText}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Thêm liên kết
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}