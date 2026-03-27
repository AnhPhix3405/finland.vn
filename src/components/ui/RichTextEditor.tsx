"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import 'katex/dist/katex.min.css';
import {
    Image as ImageIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Eye,
    EyeOff,
    Underline as UnderlineIcon,
    Strikethrough as StrikeIcon,
    List,
    ListOrdered,
    Maximize,
    Minimize,
    HelpCircle,
} from 'lucide-react';
import MarkdownHelpModal from './MarkdownHelpModal';
import { AdminMediaPicker } from '../feature/AdminMediaPicker';
import { renderMarkdownSafe } from '@/src/lib/renderMarkdownSafe';

export default function RichTextEditor({ value, onChange, placeholder }: { value?: string, onChange?: (val: string) => void, placeholder?: string }) {
    const mdEditorRef = useRef<MdEditor>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
    const [viewMode, setViewMode] = useState({ menu: true, md: true, html: false });
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    // Theo dõi trạng thái fullscreen qua browser API
    useEffect(() => {
        const handleFsChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    const toggleFullScreen = useCallback(() => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }, []);

    const handleMediaSelect = (urls: string[]) => {
        if (!mdEditorRef.current || urls.length === 0) return;

        let markdownImages = "";
        urls.forEach(url => {
            markdownImages += `\n![image](${url})\n`;
        });

        const editor = mdEditorRef.current as any;
        editor.insertText?.(markdownImages, true);
    };

    const handleFormat = (type: 'underline' | 'strikethrough') => {
        if (!mdEditorRef.current) return;
        const editor = mdEditorRef.current as any;
        const selection = editor.getSelection?.() || { text: '', start: 0, end: 0 };
        const text = selection.text || '';

        // Xử lý khi không bôi đen chữ
        if (!text) {
            const wrapped = type === 'underline' ? `<u></u>` : `~~~~`;
            const innerCursorPos = type === 'underline' ? selection.start + 3 : selection.start + 2;
            editor.insertText?.(wrapped, true, { start: innerCursorPos, end: innerCursorPos });
            return;
        }

        // Xử lý khi có bôi đen chữ
        let wrapped = "";
        if (type === 'underline') wrapped = `<u>${text}</u>`;
        if (type === 'strikethrough') wrapped = `~~${text}~~`;

        editor.insertText?.(wrapped, true);
    };

    const handleList = (type: 'bullet' | 'ordered') => {
        if (!mdEditorRef.current) return;
        const editor = mdEditorRef.current as any;
        const selection = editor.getSelection?.() || { text: '' };
        const text = selection.text || '';

        if (!text) {
            const prefix = type === 'bullet' ? '- ' : '1. ';
            editor.insertText?.(prefix, true);
            return;
        }

        const lines = text.split('\n');
        const formattedLines = lines.map((line: string, index: number) => {
            if (type === 'bullet') return `- ${line}`;
            return `${index + 1}. ${line}`;
        });

        editor.insertText?.(formattedLines.join('\n'), true);
    };

    const handleAlign = (alignment: 'left' | 'center' | 'right') => {
        if (!mdEditorRef.current) return;
        const editor = mdEditorRef.current as any;
        const selection = editor.getSelection?.() || { text: '' };
        let text = (selection.text || '').trim();

        const alignRegex = /^<div align="(?:left|center|right)">\n\n([\s\S]*?)\n\n<\/div>$/;
        const match = text.match(alignRegex);
        if (match) {
            text = match[1].trim();
        }

        const wrapped = `<div align="${alignment}">\n\n${text}\n\n</div>`;
        editor.insertText?.(wrapped, true);
    };

    return (
        <div ref={containerRef} className="relative bg-white">
            <MdEditor
                key={viewMode.html ? "preview-on" : "preview-off"}
                ref={mdEditorRef}
                value={value || ''}
                className="custom-markdown-editor"
                style={{ height: isFullScreen ? '100vh' : '500px' }}
                view={viewMode}
                htmlClass="markdown-content"
                plugins={['header', 'font-bold', 'font-italic', 'link', 'block-quote', 'block-code-inline', 'block-code-block', 'table', 'full-screen']}
                renderHTML={text => renderMarkdownSafe(text)}
                onChange={({ text }) => onChange?.(text)}
            />

            {/* ? Help — standalone ở ngoài cùng bên phải header */}
            <div className="absolute top-[5px] right-[6px] z-20">
                <button
                    type="button"
                    className="w-6 h-6 flex items-center justify-center rounded-full bg-white border border-slate-300 hover:bg-indigo-50 hover:border-indigo-300 text-slate-400 hover:text-indigo-500 shadow-sm transition-all"
                    onClick={() => setIsHelpOpen(true)}
                    title="Hỗ trợ Markdown"
                >
                    <HelpCircle className="size-3.5" />
                </button>
            </div>

            {/* Custom toolbar — nằm ở góc phải của toolbar, cách nút ? */}
            <div className="absolute top-0 right-8 h-[40px] z-10 flex items-center gap-1.5 pr-1">
                {/* View Toggle */}
                <button
                    type="button"
                    className={`p-1 px-2 rounded border transition-all flex items-center gap-1.5 shadow-sm font-bold text-[10px] uppercase tracking-wider ${viewMode.html
                            ? "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                            : "bg-white border-slate-300 text-slate-500 hover:bg-slate-50"
                        }`}
                    onClick={() => setViewMode(prev => ({ ...prev, html: !prev.html }))}
                    title={viewMode.html ? "Đóng preview" : "Mở preview"}
                >
                    {viewMode.html ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                    <span>Preview</span>
                </button>

                {/* Full Screen Toggle — chỉ icon, không text */}
                <button
                    type="button"
                    className={`p-1.5 rounded border transition-all flex items-center justify-center shadow-sm ${isFullScreen
                            ? "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100"
                            : "bg-white border-slate-300 text-slate-500 hover:bg-slate-50"
                        }`}
                    onClick={toggleFullScreen}
                    title={isFullScreen ? "Thu nhỏ" : "Toàn màn hình"}
                >
                    {isFullScreen ? <Minimize className="size-3.5" /> : <Maximize className="size-3.5" />}
                </button>

                {/* Text Decoration Group */}
                <div className="flex bg-white border border-slate-200 rounded overflow-hidden shadow-sm">
                    <button
                        type="button"
                        className="p-1 px-1.5 hover:bg-slate-100 text-slate-700 transition-colors border-r border-slate-200"
                        onClick={() => handleFormat('underline')}
                        title="Gạch chân"
                    >
                        <UnderlineIcon className="size-3.5" />
                    </button>
                    <button
                        type="button"
                        className="p-1 px-1.5 hover:bg-slate-100 text-slate-700 transition-colors"
                        onClick={() => handleFormat('strikethrough')}
                        title="Gạch ngang"
                    >
                        <StrikeIcon className="size-3.5" />
                    </button>
                </div>

                {/* List Group */}
                <div className="flex bg-white border border-slate-200 rounded overflow-hidden shadow-sm">
                    <button
                        type="button"
                        className="p-1 px-1.5 hover:bg-slate-100 text-slate-700 transition-colors border-r border-slate-200"
                        onClick={() => handleList('bullet')}
                        title="Danh sách dấu chấm"
                    >
                        <List className="size-3.5" />
                    </button>
                    <button
                        type="button"
                        className="p-1 px-1.5 hover:bg-slate-100 text-slate-700 transition-colors"
                        onClick={() => handleList('ordered')}
                        title="Danh sách số"
                    >
                        <ListOrdered className="size-3.5" />
                    </button>
                </div>

                {/* Alignment Group */}
                <div className="flex bg-white border border-slate-200 rounded overflow-hidden shadow-sm">
                    <button
                        type="button"
                        className="p-1 px-1.5 hover:bg-slate-100 text-slate-700 transition-colors border-r border-slate-200"
                        onClick={() => handleAlign('left')}
                        title="Căn trái"
                    >
                        <AlignLeft className="size-3.5" />
                    </button>
                    <button
                        type="button"
                        className="p-1 px-1.5 hover:bg-slate-100 text-slate-700 transition-colors border-r border-slate-200"
                        onClick={() => handleAlign('center')}
                        title="Căn giữa"
                    >
                        <AlignCenter className="size-3.5" />
                    </button>
                    <button
                        type="button"
                        className="p-1 px-1.5 hover:bg-slate-100 text-slate-700 transition-colors"
                        onClick={() => handleAlign('right')}
                        title="Căn phải"
                    >
                        <AlignRight className="size-3.5" />
                    </button>
                </div>

                {/* Image Button */}
                <button
                    type="button"
                    className="p-1 bg-white hover:bg-slate-100 text-slate-700 rounded transition-colors flex items-center gap-1 border border-slate-200 shadow-sm"
                    onClick={() => setIsMediaPickerOpen(true)}
                    title="Thêm ảnh"
                >
                    <ImageIcon className="size-3.5" />
                    <span className="text-[11px] font-medium leading-none px-1 uppercase whitespace-nowrap">Thêm ảnh</span>
                </button>

            </div>

            <AdminMediaPicker
                isOpen={isMediaPickerOpen}
                onClose={() => setIsMediaPickerOpen(false)}
                onSelect={handleMediaSelect}
            />
            <MarkdownHelpModal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
            />
        </div>
    );
}