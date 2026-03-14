"use client";

import React, { useState, useRef } from 'react';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import { Image as ImageIcon } from 'lucide-react';
import MediaPicker from '../feature/MediaPicker';

const mdParser = new MarkdownIt();

export default function RichTextEditor({ value, onChange, placeholder }: { value?: string, onChange?: (val: string) => void, placeholder?: string }) {
    const mdEditorRef = useRef<MdEditor>(null);
    const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

    const handleMediaSelect = (urls: string[]) => {
        if (!mdEditorRef.current || urls.length === 0) return;

        let markdownImages = "";
        urls.forEach(url => {
            markdownImages += `\n![image](${url})\n`;
        });

        mdEditorRef.current.insertText(markdownImages);
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

            {/* Custom Upload Button at top-right of the MdEditor toolbar */}
            <button
                type="button"
                className="absolute top-2 right-4 z-10 p-1 bg-white hover:bg-slate-100 text-slate-700 rounded transition-colors flex items-center gap-1 border border-slate-300 shadow-sm"
                onClick={() => setIsMediaPickerOpen(true)}
                title="Thêm ảnh"
            >
                <ImageIcon className="w-[14px] h-[14px]" />
                <span className="text-[11px] font-medium leading-none px-1 uppercase">Thêm ảnh</span>
            </button>

            {/* Popup Media Picker */}
            <MediaPicker
                isOpen={isMediaPickerOpen}
                onClose={() => setIsMediaPickerOpen(false)}
                onSelect={handleMediaSelect}
            />
        </div>
    );
}