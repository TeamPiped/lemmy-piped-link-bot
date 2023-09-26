import { LemmyBot } from "lemmy-bot";
import { getPipedLinks, UrlLink } from "./utils";

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
    markAsBot: true,
    handlers: {
        comment: {
            handle: ({
                commentView: {
                    comment: { content, id, post_id },
                    creator: { bot_account },
                },
                botActions: { createComment },
            }) => {
                if (bot_account) {
                    return;
                }
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
                    arr_matches.forEach(m => {
                        (async () => {
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
                        })().catch(err => console.error(err));
                    });

                    sendPrivateMessage({
                        recipient_id: creator_id,
                        content:
                            "I've tried followed following communities you mentioned in your message:\n\n" +
                            arr_matches.map(m => m[0]).join("\n\n"),
                    }).catch(err => console.error(err));
                }
            },
        },
    },
});

bot.start();
