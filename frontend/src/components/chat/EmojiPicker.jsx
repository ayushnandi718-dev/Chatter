import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Search, X } from "lucide-react";

const CATEGORIES = [
    {
        id: "recent",
        name: "Recently Used",
        icon: "🕐",
        emojis: [],
    },
    {
        id: "smileys",
        name: "Smileys & Emotion",
        icon: "😀",
        emojis: [
            "😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃",
            "😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😙",
            "🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🫢",
            "🫣","🤫","🤔","🫡","🤐","🤨","😐","😑","😶","🫥",
            "😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴",
            "😷","🤒","🤕","🤢","🤮","🥵","🥶","🥴","😵","🤯",
            "🤠","🥳","🥸","😎","🤓","🧐","😕","🫤","😟","🙁",
            "😮","😯","😲","😳","🥺","🥹","😦","😧","😨","😰",
            "😥","😢","😭","😱","😖","😣","😞","😓","😩","😫",
            "🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩",
            "🤡","👹","👺","👻","👽","👾","🤖",
        ],
    },
    {
        id: "people",
        name: "People & Body",
        icon: "👋",
        emojis: [
            "👋","🤚","🖐️","✋","🖖","🫱","🫲","🫳","🫴","👌",
            "🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉",
            "👆","🖕","👇","☝️","🫵","👍","👎","✊","👊","🤛",
            "🤜","👏","🙌","🫶","👐","🤲","🤝","🙏","✍️","💅",
            "🤳","💪","🦾","🦿","🦵","🦶","👂","🦻","👃","🧠",
            "🫀","🦷","🦴","👀","👁️","👅","👄","🫦","👶","🧒",
            "👦","👧","🧑","👱","👨","🧔","👩","🧓","👴","👵",
            "🙍","🙎","🙅","🙆","💁","🙋","🧏","🙇","🤦","🤷",
            "👮","🕵️","💂","🥷","👷","🫅","🤴","👸","👳","👲",
            "🧕","🤵","👰","🤰","🫃","🤱","👼","🎅","🤶","🦸",
            "🦹","🧙","🧚","🧛","🧜","🧝","🧞","🧟","🧌","💆",
            "💇","🚶","🧍","🧎","🏃","💃","🕺","👯","🧖","🧗",
            "🏇","⛷️","🏂","🏋️","🤼","🤸","⛹️","🤺","🤾","🏌️",
            "🏇","🧘","🏄","🏊","🤽","🚣","🧗","🚵","🚴","🏆",
        ],
    },
    {
        id: "animals",
        name: "Animals & Nature",
        icon: "🐶",
        emojis: [
            "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨",
            "🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐒",
            "🐔","🐧","🐦","🐤","🐣","🐥","🦆","🦅","🦉","🦇",
            "🐺","🐗","🐴","🦄","🐝","🪱","🐛","🦋","🐌","🐞",
            "🐜","🪰","🪲","🪳","🦟","🦗","🕷️","🦂","🐢","🐍",
            "🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠",
            "🐟","🐬","🐳","🐋","🦈","🐊","🐅","🐆","🦓","🦍",
            "🦧","🐘","🦣","🦛","🦏","🐪","🐫","🦒","🦘","🦬",
            "🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌",
            "🐕","🐩","🦮","🐈","🐈‍⬛","🪶","🐓","🦃","🦤","🦚",
            "🦜","🦢","🦩","🕊️","🐇","🦝","🦨","🦡","🦫","🦦",
            "🦥","🐁","🐀","🐿️","🦔","🐾","🐉","🐲","🌵","🎄",
            "🌲","🌳","🌴","🪵","🌱","🌿","☘️","🍀","🎍","🪴",
            "🎋","🍃","🍂","🍁","🪺","🪹","🍄","🐚","🪸","🪨",
            "🌊","🎆","🎇","🧨","✨","🎈","🎉","🎊","🎋","🎍",
        ],
    },
    {
        id: "food",
        name: "Food & Drink",
        icon: "🍔",
        emojis: [
            "🍇","🍈","🍉","🍊","🍋","🍌","🍍","🥭","🍎","🍏",
            "🍐","🍑","🍒","🍓","🫐","🥝","🍅","🫒","🥥","🥑",
            "🍆","🥔","🥕","🌽","🌶️","🫑","🥒","🥬","🥦","🧄",
            "🧅","🥜","🫘","🌰","🫚","🫛","🍞","🥐","🥖","🫓",
            "🥨","🥯","🥞","🧇","🧀","🍖","🍗","🥩","🥓","🍔",
            "🍟","🍕","🌭","🥪","🌮","🌯","🫔","🥙","🧆","🥚",
            "🍳","🥘","🍲","🫕","🥣","🥗","🍿","🧈","🧂","🥫",
            "🍱","🍘","🍙","🍚","🍛","🍜","🍝","🍠","🍢","🍣",
            "🍤","🍥","🥮","🍡","🥟","🥠","🥡","🦀","🦞","🦐",
            "🦑","🦪","🍦","🍧","🍨","🍩","🍪","🎂","🍰","🧁",
            "🥧","🍫","🍬","🍭","🍮","🍯","🍼","🥛","☕","🫖",
            "🍵","🍶","🍾","🍷","🍸","🍹","🍺","🍻","🥂","🥃",
            "🫗","🥤","🧋","🧃","🧉","🧊","🥢","🍽️","🍴","🥄",
            "🔪","🫙","🏺",
        ],
    },
    {
        id: "travel",
        name: "Travel & Places",
        icon: "✈️",
        emojis: [
            "🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚐",
            "🛻","🚚","🚛","🚜","🛵","🏍️","🛺","🚲","🛴","🛹",
            "🛼","🚏","🛣️","🛤️","🛞","🛢️","⛽","🛞","🚨","🚥",
            "🚦","🛑","🚧","⚓","🛟","⛵","🛶","🚤","🛳️","⛴️",
            "🛥️","🚢","✈️","🛩️","🛫","🛬","🪂","💺","🚁","🚟",
            "🚠","🚡","🛰️","🚀","🛸","🌍","🌎","🌏","🗺️","🧭",
            "🏔️","⛰️","🌋","🗻","🏕️","🏖️","🏜️","🏝️","🏞️","🏟️",
            "🏛️","🏗️","🧱","🪨","🪵","🛖","🏠","🏡","🏘️","🏚️",
            "🏗️","🏭","🏢","🏬","🏣","🏤","🏥","🏦","🏨","🏪",
            "🏫","🏩","💒","🏛️","⛪","🕌","🕍","🛕","🕋","⛩️",
            "🗼","🗽","⛲","🌁","🌃","🏙️","🌄","🌅","🌆","🌇",
            "🌉","🎠","🛝","🎡","🎢","💈","🎪","🚂","🚃","🚄",
            "🚅","🚆","🚇","🚈","🚉","🚊","🚝","🚞","🚋","🚌",
            "🚍","🚎","🚐","🚑","🚒","🚓","🚔","🚕","🚖","🚗",
            "🚘","🚙","🛻","🚚","🚛","🚜","🏎️","🏍️","🛵","🚲",
        ],
    },
    {
        id: "activities",
        name: "Activities",
        icon: "⚽",
        emojis: [
            "⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱",
            "🪀","🏓","🏸","🏒","🏑","🥍","🏏","🪃","🥅","⛳",
            "🪁","🏹","🎣","🤿","🥊","🥋","🎽","🛹","🛼","🛷",
            "⛸️","🥌","🎿","🎯","🪃","🪀","🎮","🕹️","🎰","🎲",
            "🧩","🧸","🪅","🪆","♠️","♥️","♦️","♣️","♟️","🃏",
            "🀄","🎴","🎭","🖼️","🎨","🧵","🪡","🧶","🪢","🎀",
            "🎁","🎈","🎉","🎊","🎋","🎍","🎎","🎏","🎐","🎑",
            "🧧","💝","💘","❤️","🧡","💛","💚","💙","💜","🖤",
            "🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗",
            "💖","💘","💝","💟","☮️","✝️","☪️","🕉️","☸️","✡️",
            "🔯","🕎","☯️","☦️","🛐","⛎","♈","♉","♊","♋",
            "♌","♍","♎","♏","♐","♑","♒","♓","🆔","⚛️",
        ],
    },
    {
        id: "objects",
        name: "Objects",
        icon: "💡",
        emojis: [
            "⌚","📱","📲","💻","⌨️","🖥️","🖨️","🖱️","🖲️","🕹️",
            "🗜️","💽","💾","💿","📀","📼","📷","📸","📹","🎥",
            "📽️","🎞️","📞","☎️","📟","📠","📺","📻","🎙️","🎚️",
            "🎛️","🧭","⏱️","⏲️","⏰","🕰️","⏳","📡","🔋","🪫",
            "🔌","💡","🔦","🕯️","🪔","🧯","🛢️","💸","💵","💴",
            "💶","💷","🪙","💰","💳","💎","⚖️","🪜","🧰","🪛",
            "🔧","🔨","⚒️","🛠️","⛏️","🪚","🔩","⚙️","🪤","🧱",
            "⛓️","🧲","🔫","💣","🧨","🪓","🔪","🗡️","⚔️","🛡️",
            "🚬","⚰️","🪦","⚱️","🏺","🔮","📿","🧿","🪬","💈",
            "⚗️","🔭","🔬","🕳️","🩹","🩺","🩻","🩼","💊","💉",
            "🩸","🧬","🧫","🧪","🌡️","🧹","🪠","🧺","🧻","🚽",
            "🚰","🚿","🛁","🛀","🧼","🪥","🪒","🧽","🪣","🧴",
            "🛎️","🔑","🗝️","🚪","🪑","🛋️","🛏️","🛌","🧸","🪆",
            "🖼️","🪞","🪟","🛍️","🛒","🎁","🎈","🎏","🎀","🪄",
            "🪅","🎪","🎫","🎟️","🎠","🛝","🎡","🎢","🗺️","🗿",
        ],
    },
    {
        id: "symbols",
        name: "Symbols",
        icon: "🔣",
        emojis: [
            "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔",
            "❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️",
            "✝️","☪️","🕉️","☸️","✡️","🔯","🕎","☯️","☦️","🛐",
            "⛎","♈","♉","♊","♋","♌","♍","♎","♏","♐",
            "♑","♒","♓","🆔","⚛️","🉑","☢️","☣️","📴","📳",
            "🈶","🈚","🈸","🈺","🈷️","✴️","🆚","💮","🉐","㊙️",
            "㊗️","🈴","🈵","🈹","🈲","🅰️","🅱️","🆎","🆑","🅾️",
            "🆘","❌","⭕","🛑","⛔","📛","🚫","💯","💢","♨️",
            "🚷","🚯","🚳","🚱","🔞","📵","🚭","❗","❕","❓",
            "❔","‼️","⁉️","🔅","🔆","〽️","⚠️","🚸","🔱","⚜️",
            "🔰","♻️","✅","🈯","💹","❇️","✳️","❎","🌐","💠",
            "Ⓜ️","🌀","💤","🏧","🚾","♿","🅿️","🛗","🈳","🈂️",
            "🛂","🛃","🛄","🛅","🚹","🚺","🚼","⚧️","🚻","🚮",
            "🎦","📶","🈁","🔣","ℹ️","🔤","🔡","🔠","🆖","🆗",
            "🆙","🆒","🆕","🆓","0️⃣","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣",
            "6️⃣","7️⃣","8️⃣","9️⃣","🔟","🔢","#️⃣","*️⃣","⏏️","▶️",
            "⏸️","⏯️","⏹️","⏺️","⏭️","⏮️","⏩","⏪","⏫","⏬",
            "◀️","🔼","🔽","➡️","⬅️","⬆️","⬇️","↗️","↘️","↙️",
            "↖️","↕️","↔️","↪️","↩️","⤴️","⤵️","🔀","🔁","🔂",
            "🔄","🔃","🎵","🎶","➕","➖","➗","✖️","🟰","♾️",
            "💲","💱","™️","©️","®️","〰️","➰","➿","🔚","🔙",
            "🔛","🔝","🔜","✔️","☑️","🔘","🔴","🟠","🟡","🟢",
            "🔵","🟣","⚫","⚪","🟤","🔺","🔻","🔸","🔶","🔷",
            "🔹","Increment","💠","🔳","🔲","▪️","▫️","◾","◽","◼️",
            "◻️","🟥","🟧","🟨","🟩","🟦","🟪","⬛","⬜","🟫",
            "🔈","🔇","🔉","🔊","🔔","🔕","📣","📢",
        ],
    },
];

export function EmojiPicker({ onSelect, onClose }) {
    const [activeCategory, setActiveCategory] = useState("recent");
    const [searchQuery, setSearchQuery] = useState("");
    const [recentEmojis, setRecentEmojis] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("recent-emojis") || "[]");
        } catch {
            return [];
        }
    });

    const containerRef = useRef(null);
    const searchRef = useRef(null);
    const categoryRefs = useRef({});

    const categories = useMemo(() => {
        return CATEGORIES.map((cat) => {
            if (cat.id === "recent") return { ...cat, emojis: recentEmojis };
            return cat;
        });
    }, [recentEmojis]);

    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return categories;
        const q = searchQuery.toLowerCase();
        return categories
            .filter((cat) => cat.id !== "recent")
            .map((cat) => ({
                ...cat,
                emojis: cat.emojis.filter((emoji) =>
                    cat.name.toLowerCase().includes(q)
                ),
            }))
            .filter((cat) => cat.emojis.length > 0);
    }, [categories, searchQuery]);

    const handleSelect = useCallback((emoji) => {
        onSelect(emoji);
        setRecentEmojis((prev) => {
            const updated = [emoji, ...prev.filter((e) => e !== emoji)].slice(0, 30);
            localStorage.setItem("recent-emojis", JSON.stringify(updated));
            return updated;
        });
    }, [onSelect]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                onClose();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);

    useEffect(() => {
        if (searchRef.current) searchRef.current.focus();
    }, []);

    const scrollToCategory = (catId) => {
        setActiveCategory(catId);
        if (categoryRefs.current[catId]) {
            categoryRefs.current[catId].scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    return (
        <div
            ref={containerRef}
            className="rounded-xl flex flex-col overflow-hidden"
            style={{
                width: "100%",
                maxWidth: "320px",
                maxHeight: "350px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            }}
        >
            {/* Search */}
            <div
                className="flex items-center gap-2 px-3 py-2 shrink-0"
                style={{ borderBottom: "1px solid var(--border)" }}
            >
                <Search className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search emoji..."
                    className="flex-1 bg-transparent text-[11px] outline-none placeholder:text-[var(--text-muted)]"
                    style={{ color: "var(--text-primary)" }}
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery("")}
                        className="h-5 w-5 flex items-center justify-center rounded-full transition-colors"
                        style={{ color: "var(--text-muted)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                        <X className="h-3 w-3" />
                    </button>
                )}
            </div>

            {/* Category tabs */}
            <div
                className="flex items-center gap-0.5 px-2 py-1.5 shrink-0 overflow-x-auto"
                style={{ borderBottom: "1px solid var(--border)" }}
            >
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => scrollToCategory(cat.id)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[13px] transition-colors"
                        style={{
                            background: activeCategory === cat.id ? "var(--bg-hover)" : "transparent",
                            opacity: activeCategory === cat.id ? 1 : 0.6,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                        onMouseLeave={(e) =>
                            (e.currentTarget.style.background =
                                activeCategory === cat.id ? "var(--bg-hover)" : "transparent")
                        }
                        title={cat.name}
                    >
                        {cat.icon}
                    </button>
                ))}
            </div>

            {/* Emoji grid */}
            <div
                className="flex-1 overflow-y-auto px-2 py-2"
                onScroll={(e) => {
                    if (searchQuery) return;
                    const { scrollTop } = e.currentTarget;
                    for (let i = categories.length - 1; i >= 0; i--) {
                        const el = categoryRefs.current[categories[i].id];
                        if (el && el.offsetTop <= scrollTop + 50) {
                            setActiveCategory(categories[i].id);
                            break;
                        }
                    }
                }}
            >
                {filteredCategories.map((cat) => (
                    <div
                        key={cat.id}
                        ref={(el) => (categoryRefs.current[cat.id] = el)}
                        className="mb-2"
                    >
                        {cat.emojis.length > 0 && (
                            <p
                                className="text-[9px] font-semibold uppercase tracking-wider mb-1 px-1"
                                style={{ color: "var(--text-muted)" }}
                            >
                                {cat.name}
                            </p>
                        )}
                        <div className="grid grid-cols-8 gap-0.5">
                            {cat.emojis.map((emoji, i) => (
                                <button
                                    key={`${cat.id}-${emoji}-${i}`}
                                    onClick={() => handleSelect(emoji)}
                                    className="flex h-8 w-8 items-center justify-center rounded-md text-[18px] transition-transform hover:scale-125"
                                    style={{ background: "transparent" }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                {filteredCategories.every((cat) => cat.emojis.length === 0) && (
                    <div className="flex flex-col items-center justify-center py-8">
                        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                            No emojis found
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
