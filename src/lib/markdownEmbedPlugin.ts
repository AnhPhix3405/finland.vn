const escape = require('lodash/escape');

const regexp = /^\{@(embed|youtube)\s*:\s*([^\s}]+)\}/;

function parse(state: any, silent: boolean) {
    if (state.src.charCodeAt(state.pos) !== 123) return false;

    const match = regexp.exec(state.src.slice(state.pos));

    if (!match) return false;

    if (!silent) {
        const provider = match[1] === 'embed' ? null : match[1];
        const url = match[2];
        const token = state.push('at-embed', 'embed', 0);

        token.meta = { provider };
        token.content = url;
    }

    state.pos += match[0].length;
    return true;
}

const render = (options: any) => function (tokens: any[], idx: number) {
    const token = tokens[idx];
    const url = token.content;

    try {
        const urlObj = new URL(url);
        let videoId = '';

        if (urlObj.hostname.includes('youtube.com')) {
            videoId = urlObj.searchParams.get('v') || '';
        } else if (urlObj.hostname.includes('youtu.be')) {
            videoId = urlObj.pathname.slice(1);
        }

        if (videoId) {
            return `<div class="aspect-video w-full my-4 rounded-xl overflow-hidden shadow-sm border border-slate-200">
<iframe 
    src="https://www.youtube.com/embed/${escape(videoId)}" 
    title="YouTube video player" 
    frameborder="0" 
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
    allowfullscreen 
    class="w-full h-full"
></iframe>
</div>`;
        }
    } catch (e) {
        // Bỏ qua lỗi URL
    }

    // Fallback nếu không phải Youtube hoặc link lỗi
    return `{@embed: ${escape(url)}}`;
};

export const createEmbedPlugin = (options: any = {}) => function (md: any) {
    md.inline.ruler.push('at-embed', parse);
    md.renderer.rules['at-embed'] = render(options);
};
