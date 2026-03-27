import React from 'react';
import md from '@/src/components/ui/markdown';

// Mock content để test các tính năng vừa thêm
const MOCK_CONTENT = `
# Demo Markdown Content

<div align="center">

Đây là văn bản được **căn giữa** sử dụng thẻ HTML div align.

</div>

<div align="right">

Văn bản này được **căn phải**.

</div>

### Các định dạng đặc biệt:
- **Gạch chân**: <u>Nội dung này được gạch chân</u>
- **Gạch ngang**: ~~Nội dung này bị gạch ngang~~

### Danh sách:
1. Mục thứ nhất (Ordered)
2. Mục thứ hai
3. Mục thứ ba

- Dấu chấm thứ nhất (Unordered)
- Dấu chấm thứ hai

### Hình ảnh test:
![image](https://picsum.photos/800/400)a
`;

const TestMarkdownPage = () => {
    // Render markdown thành HTML
    const rawHtml = md.render(MOCK_CONTENT);

    return (
        <div className="container mx-auto p-10 max-w-4xl bg-white shadow-lg my-10 rounded-xl">
            <h1 className="text-2xl font-bold mb-8 pb-4 border-b border-slate-200 text-slate-800">
                Preview Markdown Renderer
            </h1>

            {/* Class markdown-content hoặc md-contents tùy thuộc vào CSS bạn đã định nghĩa ở globals.css */}
            <div
                className="markdown-content"
                dangerouslySetInnerHTML={{ __html: rawHtml }}
            />
        </div>
    );
}

export default TestMarkdownPage;
