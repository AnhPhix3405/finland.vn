"use client";

import React, { useState, useRef } from 'react';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import { Image as ImageIcon, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { AdminMediaPicker } from '../feature/AdminMediaPicker';

const mdParser = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true
});

export default function RichTextEditor({ value, onChange, placeholder }: { value?: string, onChange?: (val: string) => void, placeholder?: string }) {
    const mdEditorRef = useRef<MdEditor>(null);
    const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

    const handleMediaSelect = (urls: string[]) => {
        if (!mdEditorRef.current || urls.length === 0) return;

        let markdownImages = "";
        urls.forEach(url => {
            markdownImages += `\n![image](${url})\n`;
        });

        const currentValue = value || '';
        const newValue = currentValue + markdownImages;
        onChange?.(newValue);
    };

    const handleAlign = (alignment: 'left' | 'center' | 'right') => {
        if (!mdEditorRef.current) return;
        const editor = mdEditorRef.current as any;
        const selection = editor.getSelection?.() || { text: '' };
        let text = (selection.text || '').trim();
        
        // Remove existing align div if it's already there (more forgiving regex)
        const alignRegex = /^<div align="(?:left|center|right)">\n\n([\s\S]*?)\n\n<\/div>$/;
        const match = text.match(alignRegex);
        if (match) {
            text = match[1].trim();
        }

        const wrapped = `<div align="${alignment}">\n\n${text}\n\n</div>`;
        editor.insertText?.(wrapped, true);
    };

    return (
        <div className="relative">
            <MdEditor
                ref={mdEditorRef}
                value={value || ''}
                style={{ height: '500px' }}
                renderHTML={text => mdParser.render(text)}
                onChange={({ text }) => onChange?.(text)}
            />

            <div className="absolute top-2 right-4 z-10 flex items-center gap-2">
                <div className="flex bg-white border border-slate-300 rounded shadow-sm overflow-hidden selection-none">
                    <button
                        type="button"
                        className="p-1 px-1.5 hover:bg-slate-100 text-slate-700 transition-colors border-r border-slate-200"
                        onClick={() => handleAlign('left')}
                        title="Căn trái"
                    >
                        <AlignLeft className="w-[14px] h-[14px]" />
                    </button>
                    <button
                        type="button"
                        className="p-1 px-1.5 hover:bg-slate-100 text-slate-700 transition-colors border-r border-slate-200"
                        onClick={() => handleAlign('center')}
                        title="Căn giữa"
                    >
                        <AlignCenter className="w-[14px] h-[14px]" />
                    </button>
                    <button
                        type="button"
                        className="p-1 px-1.5 hover:bg-slate-100 text-slate-700 transition-colors"
                        onClick={() => handleAlign('right')}
                        title="Căn phải"
                    >
                        <AlignRight className="w-[14px] h-[14px]" />
                    </button>
                </div>

                <button
                    type="button"
                    className="p-1 bg-white hover:bg-slate-100 text-slate-700 rounded transition-colors flex items-center gap-1 border border-slate-300 shadow-sm"
                    onClick={() => setIsMediaPickerOpen(true)}
                    title="Thêm ảnh"
                >
                    <ImageIcon className="w-[14px] h-[14px]" />
                    <span className="text-[11px] font-medium leading-none px-1 uppercase whitespace-nowrap">Thêm ảnh</span>
                </button>
            </div>

            <AdminMediaPicker
                isOpen={isMediaPickerOpen}
                onClose={() => setIsMediaPickerOpen(false)}
                onSelect={handleMediaSelect}
            />
        </div>
    );
}