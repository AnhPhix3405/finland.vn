import sanitizeHtml from 'sanitize-html';
import md from '@/src/components/ui/markdown';

export function renderMarkdownSafe(markdownText: string): string {
    if (!markdownText) return '';

    // 1. Dịch từ Markdown -> HTML (bao gồm cẩ cú pháp {@embed} qua plugin)
    const rawHtml = md.render(markdownText);

    // 3. Khử trùng XSS nghiêm ngặt
    const cleanHtml = sanitizeHtml(rawHtml, {
        // Kế thừa các thẻ Markdown cơ bản và cho phép các thẻ HTML cho Iframe, CSS, KaTeX Toán học
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
            'iframe', 'img', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'del', 'u', 's',
            // --- CÁC THẺ HTML DÀNH CHO TOÁN HỌC (KATEX) ---
            'math', 'semantics', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'msubsup', 'mfrac', 'msqrt', 'mroot', 'mtable', 'mtr', 'mtd', 'mspace', 'annotation',
            // --- CÁC THẺ SVG (KATEX CẦN DÙNG CHO CĂN BẬC, GẠCH PHÂN SỐ...) ---
            'svg', 'path', 'line', 'polygon', 'rect', 'circle', 'g'
        ]),

        // Whitelist các properties được phép có
        allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder', 'title', 'class'],
            div: ['align', 'class', 'style'],
            span: ['class', 'style'],
            img: ['src', 'alt', 'class'],
            // --- THUỘC TÍNH SVG VÀ KATEX ---
            math: ['xmlns', 'display'],
            annotation: ['encoding'],
            svg: ['width', 'height', 'viewbox', 'preserveaspectratio', 'xmlns', 'focusable', 'style'],
            path: ['d', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'],
            line: ['x1', 'y1', 'x2', 'y2', 'stroke', 'stroke-width'],
            '*': ['aria-hidden'] // Cho phép aria-hidden trên mọi thẻ để hỗ trợ Screen Reader của KaTeX
        },

        // CHÌA KHÓA BẢO MẬT: Chỉ cho chèn link Iframe nếu đó là youtube
        allowedIframeHostnames: ['www.youtube.com', 'youtube.com', 'youtu.be'],

        // Đồng ý cho iframe thay đổi kích cỡ
        allowIframeRelativeUrls: false
    });

    return cleanHtml;
}
