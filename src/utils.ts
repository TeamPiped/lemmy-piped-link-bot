import { marked } from "marked";
import { JSDOM } from "jsdom";

export const getPipedLinks = (text: string): UrlLink[] => {
    const document: Document = new JSDOM(marked(text.trim())).window.document;
    const links = Array.from(document.querySelectorAll("a"))
        .filter((a: HTMLElement) => a.textContent)
        .map(a => new UrlLink(a.textContent!, a.href));

    // convert youtube links to piped links
    const pipedLinks = links.filter(link => {
        const urlObj = new URL(link.href);

        const hostnames = ["youtube.com", "youtube-nocookie.com", "youtu.be"];

        const isYt =
            urlObj.hostname.endsWith(".youtube.com") || hostnames.some(hostname => urlObj.hostname === hostname);

        if (isYt) {
            urlObj.hostname = "piped.video";
            urlObj.searchParams.delete("si");
            link.href = urlObj.toString();
            link.text = hostnames.reduce(
                (carry: string, hostname: string) => carry.split(hostname).join("piped.video"),
                link.text,
            );
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
