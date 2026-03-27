import { createRenderer } from 'viblo-sdk/markdown';

const md = createRenderer({
    baseURL: 'http://localhost:3000',
    absoluteURL: false,
    embed: {
        wrapperClass: 'embed-responsive embed-responsive-16by9',
        iframeClass: 'embed-responsive-item',
    },
    katex: {
        maxSize: 500,
        maxExpand: 100,
        maxCharacter: 1000,
    },
    clipboard: {
        copy: 'Copy',
        copied: 'Copied',
    } as any
});

import { createEmbedPlugin } from '@/src/lib/markdownEmbedPlugin';

// Bật phân tích HTML (bao gồm iframe)
md.set({ html: true });

// Tắt bộ lọc sanitizer mặc định của viblo-sdk vì nó tự ý escape thẻ <u>, <iframe>...
// Chúng ta đã dùng renderMarkdownSafe.ts để lo khâu bảo mật thay thế.
md.core.ruler.disable(['sanitize_inline', 'sanitize_balance']);

// Plugin cho parse {@embed: ...}
md.use(createEmbedPlugin());

export default md;