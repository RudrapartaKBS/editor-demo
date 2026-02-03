import { Node as ProseMirrorNode, NodeSpec } from "prosemirror-model";

export interface EmbedAttrs {
  src: string;
  type: 'youtube' | 'vimeo' | 'iframe' | 'twitter' | 'instagram' | 'tiktok';
  width?: number;
  height?: number;
  title?: string;
  align?: 'left' | 'center' | 'right' | 'none';
}

export const embed: NodeSpec = {
  attrs: {
    src: { default: "" },
    type: { default: "iframe" },
    width: { default: 560 },
    height: { default: 315 },
    title: { default: "" },
    align: { default: "center" }
  },
  group: "block",
  draggable: true,
  parseDOM: [
    {
      tag: "div.pm-embed",
      getAttrs(dom: HTMLElement) {
        return {
          src: dom.getAttribute("data-src") || "",
          type: dom.getAttribute("data-type") || "iframe",
          width: parseInt(dom.getAttribute("data-width") || "560"),
          height: parseInt(dom.getAttribute("data-height") || "315"),
          title: dom.getAttribute("data-title") || "",
          align: dom.getAttribute("data-align") || "center"
        };
      },
    },
    {
      tag: "iframe[src]",
      getAttrs(dom: HTMLElement) {
        const iframe = dom as HTMLIFrameElement;
        const src = iframe.src;
        let type: EmbedAttrs['type'] = 'iframe';
        
        if (src.includes('youtube.com') || src.includes('youtu.be')) {
          type = 'youtube';
        } else if (src.includes('vimeo.com')) {
          type = 'vimeo';
        }
        
        return {
          src,
          type,
          width: iframe.width ? parseInt(iframe.width as string) : 560,
          height: iframe.height ? parseInt(iframe.height as string) : 315,
          title: iframe.title || "",
          align: "center"
        };
      },
    },
  ],
  toDOM(node: ProseMirrorNode) {
    const { src, type, width, height, title, align } = node.attrs;
    
    return [
      "div",
      {
        class: `pm-embed pm-embed--${type} pm-embed--${align}`,
        "data-src": src,
        "data-type": type,
        "data-width": width,
        "data-height": height,
        "data-title": title,
        "data-align": align,
        style: `text-align: ${align}; margin: 1rem 0;`
      },
      [
        "iframe",
        {
          src: getEmbedUrl(src, type),
          width: width,
          height: height,
          title: title || "Embedded content",
          frameborder: "0",
          allowfullscreen: "true",
          allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
          style: "border: none; border-radius: 8px;"
        }
      ]
    ];
  },
};

// Convert various URLs to embeddable format
function getEmbedUrl(url: string, type: EmbedAttrs['type']): string {
  switch (type) {
    case 'youtube':
      return convertYouTubeUrl(url);
    case 'vimeo':
      return convertVimeoUrl(url);
    case 'twitter':
      return `https://twitframe.com/show?url=${encodeURIComponent(url)}`;
    case 'instagram':
      return `${url}embed/`;
    case 'tiktok':
      return url; // TikTok embeds need special handling
    default:
      return url;
  }
}

function convertYouTubeUrl(url: string): string {
  // Handle various YouTube URL formats
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = match && match[7].length === 11 ? match[7] : null;
  
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  
  return url;
}

function convertVimeoUrl(url: string): string {
  // Handle Vimeo URLs
  const regExp = /(?:vimeo)\.com.*(?:videos|video|channels|)\/([\d]+)/i;
  const match = url.match(regExp);
  const videoId = match ? match[1] : null;
  
  if (videoId) {
    return `https://player.vimeo.com/video/${videoId}`;
  }
  
  return url;
}