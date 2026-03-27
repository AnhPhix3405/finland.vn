export function parseEmbed(content: string): string {
    if (!content) return content;

    // Detect pattern {@embed: URL}
    const embedRegex = /\{@embed:\s*(https?:\/\/[^\s}]+)\}/g;

    return content.replace(embedRegex, (match, url) => {
        try {
            const urlObj = new URL(url);
            let videoId = '';

            // Extract YouTube video ID
            if (urlObj.hostname.includes('youtube.com')) {
                videoId = urlObj.searchParams.get('v') || '';
            } else if (urlObj.hostname.includes('youtu.be')) {
                videoId = urlObj.pathname.slice(1); // remove leading slash
            }

            if (videoId) {
                // Return iframe layout cho YouTube
                return `<div class="aspect-video w-full my-4 rounded-xl overflow-hidden shadow-sm border border-slate-200">
<iframe 
    src="https://www.youtube.com/embed/${videoId}" 
    title="YouTube video player" 
    frameborder="0" 
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
    allowfullscreen 
    class="w-full h-full"
></iframe>
</div>`;
            }

            // Nếu muốn hỗ trợ Vimeo, Codepen... thêm logic ở đây
            
            return match; // Không thuộc đối tượng hỗ trợ, giữ nguyên
        } catch (e) {
            return match; // URL không hợp lệ, giữ nguyên
        }
    });
}
