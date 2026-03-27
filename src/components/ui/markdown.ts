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

// Plugin cho parse {@embed: ...}
md.use(createEmbedPlugin());

export default md;