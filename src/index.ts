import { LemmyBot } from "lemmy-bot";
import { marked } from "marked";
import { JSDOM } from "jsdom";

class UrlLink {
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

const getPipedLinks = (text: string): UrlLink[] => {
    const document = new JSDOM(marked(text)).window.document;
    const links = Array.from(document.querySelectorAll("a"))
        .filter((a: HTMLElement) => a.textContent)
        .map(a => {
            const anchor = a as HTMLAnchorElement;
            return new UrlLink(anchor.textContent!, anchor.href);
        });

    // convert youtube links to piped links
    links.forEach(link => {
        const urlObj = new URL(link.href);

        // check if the url is a youtube video
        if (
            urlObj.hostname.endsWith(".youtube.com") ||
            urlObj.hostname === "youtube.com" ||
            urlObj.hostname === "youtube-nocookie.com" ||
            urlObj.hostname === "youtu.be"
        ) {
            urlObj.hostname = "piped.video";
            link.href = urlObj.toString();
        }
    });

    return links;
};

const generateLinkMessage = (links: UrlLink[]): string => {
    return `Here is an alternative Piped link(s): \n\n${links.join(
        "\n\n",
    )}\n\nPiped is a privacy-respecting open-source alternative frontend to YouTube.\n\nI'm open-source, check me out at [GitHub](https://github.com/TeamPiped/lemmy-piped-link-bot).`;
};

const username = process.env.USERNAME || "PipedLinkBot";
const password = process.env.PASSWORD;

if (!password) {
    throw new Error("No password provided");
}

process.on("uncaughtException", error => {
    console.error("uncaught error:");
    console.error(error);
});

const bot = new LemmyBot({
    instance: process.env.INSTANCE || "feddit.rocks",
    credentials: {
        username: username,
        password: password,
    },
    federation: "all",
    dbFile: "db.sqlite3",
    handlers: {
        comment: {
            handle: ({
                commentView: {
                    comment: { content, id, post_id },
                },
                botActions: { createComment },
            }) => {
                if (content) {
                    const pipedLinks = getPipedLinks(content);
                    if (pipedLinks.length > 0) {
                        // create a comment on the post
                        createComment({
                            post_id: post_id,
                            parent_id: id,
                            content: generateLinkMessage(pipedLinks),
                            language_id: 37,
                        }).catch(err => console.error(err));
                    }
                }
            },
            sort: "New",
        },
        post: {
            handle: ({
                postView: {
                    post: { id, url, body },
                },
                botActions: { createComment },
            }) => {
                const links: UrlLink[] = [];
                if (url) {
                    const urlObj = new URL(url);
                    // check if the url is a youtube video
                    if (
                        urlObj.hostname.endsWith(".youtube.com") ||
                        urlObj.hostname === "youtube.com" ||
                        urlObj.hostname === "youtube-nocookie.com" ||
                        urlObj.hostname === "youtu.be"
                    ) {
                        urlObj.hostname = "piped.video";
                        const url = urlObj.toString();
                        links.push(new UrlLink(url, url));
                    }
                }
                if (body) {
                    const pipedLinks = getPipedLinks(body);
                    links.push(...pipedLinks);
                }

                if (links.length > 0) {
                    // create a comment on the post
                    createComment({
                        post_id: id,
                        content: generateLinkMessage(links),
                        language_id: 37,
                    }).catch(err => console.error(err));
                }
            },
            sort: "New",
        },
        privateMessage: {
            handle: ({
                messageView: {
                    private_message: { content, creator_id },
                },
                botActions: { getCommunityId, resolveObject, followCommunity, sendPrivateMessage },
            }) => {
                if (content) {
                    const regex = /!([\w]+)@([a-zA-Z0-9.-]+)/gm;
                    const matches = content.matchAll(regex);
                    const arr_matches = Array.from(matches, m => m);
                    arr_matches.forEach(async m => {
                        const communityName = m[1];
                        const instanceName = m[2];
                        console.log(`Searching community: ${communityName} on instance: ${instanceName}`);
                        let communityId = await getCommunityId({
                            name: communityName,
                            instance: instanceName,
                        });

                        if (!communityId) {
                            await resolveObject(m[0])
                                .then(res => res?.community?.community?.id)
                                .then(id => {
                                    if (id) {
                                        communityId = id;
                                    }
                                })
                                .catch(err => console.error(err));
                        }

                        console.log(`Found community: ${communityId}`);

                        if (communityId) {
                            await followCommunity(communityId).catch(err => console.error(err));
                        }
                    });

                    sendPrivateMessage({
                        recipient_id: creator_id,
                        content:
                            "I've tried followed following communities you mentioned in your message:\n\n" +
                            arr_matches.map(m => m[0]).join("\n\n"),
                    });
                }
            },
        },
    },
});

bot.start();
