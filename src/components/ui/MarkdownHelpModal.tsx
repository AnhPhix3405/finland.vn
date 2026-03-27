"use client";

import React from 'react';
import { X } from 'lucide-react';

const ROWS = [
    {
        label: 'In đậm',
        syntax: '**In đậm**',
        note: 'Không có khoảng trống sau khi mở và trước khi đóng',
    },
    {
        label: 'Dòng tiếp theo',
        syntax: '<br>',
        note: 'Sử dụng thẻ HTML <br> hoặc ấn Enter hai lần',
    },
    {
        label: 'In nghiêng',
        syntax: '*In nghiêng*',
        note: 'Không có khoảng trống sau khi mở và trước khi đóng',
    },
    {
        label: 'Inline code',
        syntax: '`code`',
        note: '',
    },
    {
        label: 'Khối code',
        syntax: '```javascript\nvar s = \'Đánh dấu cú pháp\';\n```',
    },
    {
        label: 'Liên kết',
        syntax: '[Liên kết](http://~)',
        note: '',
    },
    {
        label: 'Hình ảnh',
        syntax: '![alt](http://~)',
        note: '',
    },
    {
        label: 'Tiêu đề (h1~h6)',
        syntax: '# h1\n## h2\n### h3',
        note: '1 dấu cách sau #',
    },
    {
        label: 'Danh sách không thứ tự',
        syntax: '* Item',
        note: '1 dấu cách sau *',
    },
    {
        label: 'Danh sách có thứ tự',
        syntax: '1. Item',
        note: '',
    },
    {
        label: 'Đường kẻ ngang',
        syntax: '* * *',
        note: '',
    },
    {
        label: 'Blockquote',
        syntax: '> Blockquotes',
        note: '',
    },
    {
        label: 'Bảng',
        syntax: '| Cột 1 | Cột 2 |\n| - | - |\n| Chữ | Chữ |',
        note: '',
    },
    {
        label: 'Escape markdown',
        syntax: '\\',
        note: '',
    },
    {
        label: 'Nhúng nội dung',
        syntax: '{@embed: URL}',
        note: 'Youtube, Vimeo, Slideshare, Codepen, Gist, JsFiddle, Google Slide, Soundcloud',
    },
    {
        label: 'Công thức toán học',
        syntax: 'Inline: $f(x) = x$\n\nBlock:\n$$\nf(x) = x\n$$',
        note: 'Inline: không có khoảng trống sau $ mở và trước $ đóng',
    },
    {
        label: 'Căn chỉnh',
        syntax: '<div align="left|right|center|justify">\n\n  [Nội dung]\n\n</div>',
        note: 'Một số cú pháp Markdown có thể không hoạt động bên trong thẻ HTML',
    },
];

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function MarkdownHelpModal({ isOpen, onClose }: Props) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-800">Hỗ trợ Markdown</span>
                        <span className="text-[11px] text-slate-400 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 font-mono">?</span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded hover:bg-slate-200 text-slate-500 transition-colors"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-y-auto flex-1">
                    <table className="w-full text-sm border-collapse">
                        <thead className="sticky top-0 bg-slate-50 z-10">
                            <tr>
                                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 w-[28%]">Component</th>
                                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 w-[32%]">Cú pháp</th>
                                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Ghi chú</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ROWS.map((row, i) => (
                                <tr
                                    key={i}
                                    className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                                >
                                    <td className="px-4 py-2.5 align-top text-slate-700 font-medium border-b border-slate-100 text-[13px]">
                                        {row.label}
                                    </td>
                                    <td className="px-4 py-2.5 align-top border-b border-slate-100">
                                        <pre className="text-[12px] font-mono text-indigo-700 bg-indigo-50 rounded px-2 py-1 whitespace-pre-wrap leading-relaxed">
                                            {row.syntax}
                                        </pre>
                                    </td>
                                    <td className="px-4 py-2.5 align-top text-slate-500 text-[12px] border-b border-slate-100 leading-relaxed">
                                        {row.note}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
