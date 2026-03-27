"use client";

import React, { useState, useRef } from 'react';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import { Image as ImageIcon, AlignLeft, AlignCenter, AlignRight, Eye, EyeOff } from 'lucide-react';
import { AdminMediaPicker } from '../feature/AdminMediaPicker';

const mdParser = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true
});

export default function RichTextEditor({ value, onChange, placeholder }: { value?: string, onChange?: (val: string) => void, placeholder?: string }) {
    const mdEditorRef = useRef<MdEditor>(null);
    const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
    const [viewMode, setViewMode] = useState({ menu: true, md: true, html: false });

    const handleMediaSelect = (urls: string[]) => {
        if (!mdEditorRef.current || urls.length === 0) return;

        let markdownImages = "";
        urls.forEach(url => {
            markdownImages += `\n![image](${url})\n`;
        });

        const editor = mdEditorRef.current as any;
        editor.insertText?.(markdownImages, true);
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
                key={viewMode.html ? "preview-on" : "preview-off"}
                ref={mdEditorRef}
                value={value || ''}
                className="custom-markdown-editor"
                style={{ height: '500px' }}
                view={viewMode}
                renderHTML={text => mdParser.render(text)}
                onChange={({ text }) => onChange?.(text)}
            />

            <div className="absolute top-2.5 right-8 z-10 flex items-center gap-2">
                <button
                    type="button"
                    className={`p-1 px-2 rounded border transition-all flex items-center gap-1.5 shadow-sm font-bold text-[10px] uppercase tracking-wider ${
                        viewMode.html 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100" 
                        : "bg-white border-slate-300 text-slate-500 hover:bg-slate-50"
                    }`}
                    onClick={() => setViewMode(prev => ({ ...prev, html: !prev.html }))}
                    title={viewMode.html ? "Đóng preview" : "Mở preview"}
                >
                    {viewMode.html ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{viewMode.html ? "Đóng preview" : "Mở preview"}</span>
                </button>

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