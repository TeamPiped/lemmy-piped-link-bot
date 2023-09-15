import { marked } from "marked";
import { JSDOM } from "jsdom";

export const getPipedLinks = (text: string): UrlLink[] => {
    const document: Document = new JSDOM(marked(text.trim())).window.document;
    const links = Array.from(document.querySelectorAll("a"))
        .filter((a: HTMLElement) => a.textContent)
        .map(a => new UrlLink(a.textContent!, a.href));

    console.log(document.body.innerHTML);

    // convert youtube links to piped links
    const pipedLinks = links.filter(link => {
        const urlObj = new URL(link.href);

        const isYt =
            urlObj.hostname.endsWith(".youtube.com") ||
            urlObj.hostname === "youtube.com" ||
            urlObj.hostname === "youtube-nocookie.com" ||
            urlObj.hostname === "youtu.be";

        if (isYt) {
            urlObj.hostname = "piped.video";
            link.href = urlObj.toString();
        }

        return isYt;
    });

    return pipedLinks;
};

export class UrlLink {
    text: string;
    href: string;

    constructor(text: string, href: string) {
        this.text = text;
        this.href = href;
    }

    toString(): string {
        return `[${this.text}](${this.href})`;
    }
}
