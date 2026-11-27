/* Template banks for the AI SEO Article Writer & Analyzer demo.
   Placeholders: {topic} lowercase, {Topic} capitalised, {keyword} lowercase,
   {Keyword} capitalised, {N} a number. All content is sample data. */
(function (root) {
  var DATA = {
    TITLE_TEMPLATES: [
      "{Topic}: A Practical Guide",
      "How to Get Started with {Topic}",
      "Understanding {Topic}: A Clear, Simple Guide",
      "{Topic} — {N} Tips That Actually Work",
      "The Beginner's Guide to {Topic}",
      "{Keyword} in 2026: A Simple, Honest Guide"
    ],

    META_TEMPLATES: [
      "Learn {topic} the simple way: what it is, how to start, and the {keyword} habits that make the biggest difference — with examples you can use today.",
      "A clear, practical guide to {topic}. Covers the basics, common mistakes, and proven {keyword} tips — no jargon, no fluff.",
      "Struggling with {topic}? This guide explains {keyword} step by step, with tips, examples and answers to the questions people ask most."
    ],

    INTRO_OPENERS: {
      informative: [
        "If you have ever wondered how {topic} actually works, you are not alone. It is one of those subjects that sounds simple until you try to explain it — and then the details start to matter.",
        "{Topic} shows up in more places than most people realise. This guide gives you the full picture: what it is, why it matters, and how to approach it with confidence.",
        "There is a lot of noisy advice about {topic}. This article cuts through it and focuses on the {keyword} basics that hold up in practice."
      ],
      howto: [
        "You do not need experience to start with {topic}. You need a clear first step, a little patience, and a method you can repeat. This guide gives you all three.",
        "Starting {topic} feels harder than it is. Most of the difficulty comes from not knowing where to begin — so let us fix that first.",
        "This is a hands-on guide to {topic}. By the end, you will know exactly what to do first, what to avoid, and how to tell if your {keyword} is working."
      ],
      persuasive: [
        "Good {keyword} pays off faster than most people expect. A few small changes to how you approach {topic} can save you hours — and this guide shows you which ones.",
        "If {topic} has been on your list for a while, this is the nudge to start. The sooner you build the habit, the sooner the results show up.",
        "You already know {topic} matters. What you need is a plan that fits real life. Here is one that does."
      ]
    },

    INTRO_SECOND: [
      "In the sections below, we cover the essentials first, then the practical steps, then the mistakes worth avoiding. Every tip uses plain language, so you can apply it right away.",
      "We will start with the basics, move on to a step-by-step approach, and finish with answers to the questions people ask most about {keyword}.",
      "No prior knowledge is assumed. Whether you are starting from zero or fixing a half-finished attempt, you will find something useful here."
    ],

    /* Sections in order. `min` = shortest article length that includes it. */
    SECTIONS: [
      {
        id: "why",
        min: "short",
        headings: [
          "Why {Topic} Matters",
          "Getting the Most from {Keyword}",
          "What Makes {Topic} Worth Learning",
          "Why It Matters",
          "Why the Basics Matter"
        ],
        sentences: [
          "The simplest reason {topic} matters is that it affects results you can see. When it is done well, the difference is obvious; when it is ignored, the problems pile up quietly.",
          "Most people discover {topic} only after something goes wrong. A little {keyword} knowledge early on prevents the kind of mistakes that cost time and money later.",
          "Think of {keyword} as a foundation. Everything you build on top of it — speed, quality, confidence — depends on how solid that foundation is.",
          "Experts agree on one thing: the basics have not changed much in years. What changes is how people apply them.",
          "If you care about doing {topic} well, you cannot skip the fundamentals. They are what separate a lucky result from a repeatable one.",
          "The good news is that it rewards small, steady effort. You do not need a big overhaul — a few focused changes are enough to see progress.",
          "One way to think about it: every hour spent on the basics saves several hours of fixing things later."
        ]
      },
      {
        id: "start",
        min: "short",
        headings: [
          "How to Start with {Topic}",
          "Getting Started: Your First Steps in {Topic}",
          "Where to Begin with {Topic}",
          "Getting Started",
          "Your First Steps"
        ],
        sentences: [
          "Start small. Pick one part of {topic} and practise it until it feels natural, instead of trying to learn everything at once.",
          "The first step is to define what success looks like for you. Without a clear goal, {keyword} work drifts — with one, every step has a purpose.",
          "Gather the basics before you begin. For most people, that means a notebook, a clear schedule, and one reliable source to learn from.",
          "Do the smallest version first. A short, simple attempt teaches you more than a week of reading about it.",
          "Set a regular time for it. Fifteen minutes a day of focused practice beats a single long session once a month.",
          "Keep notes on what works. When something clicks, write it down — your future self will thank you.",
          "Ask for feedback early. A second pair of eyes catches the blind spots in your {topic} that you cannot see yourself.",
          "Expect the first try to be rough. That is normal, and it is also the fastest way to learn what to fix next."
        ],
        checklist: [
          "Define your goal in one sentence",
          "Pick one new habit to try this week",
          "Schedule three short sessions",
          "Review your notes and adjust"
        ]
      },
      {
        id: "tips",
        min: "medium",
        headings: [
          "{N} Practical {Topic} Tips",
          "{Topic} Tips That Actually Work",
          "How to Improve Your {Keyword}, Step by Step",
          "Practical Tips That Work",
          "Tips Worth Trying"
        ],
        sentences: [
          "Break the work into short sessions. Your focus stays sharper, and you improve faster than in one long slog.",
          "Use a simple checklist. It keeps you consistent and stops small steps from slipping through the cracks.",
          "Compare your results week to week, not day to day. Daily noise hides the trend; weekly comparison shows whether you are actually improving.",
          "Learn from one good example instead of ten average ones. A single well-executed piece of work teaches more than a pile of mediocre ones.",
          "Keep your tools simple. Fancy setups do not fix weak fundamentals — solid habits do.",
          "Review your work after a short break. Fresh eyes spot problems that tired eyes walk straight past.",
          "Teach someone else what you learned. Explaining {topic} in plain words is the fastest test of whether you really understand it.",
          "Save your best examples. A small library of good work becomes your reference for everything after."
        ],
        list: [
          "Do one small part of {topic} every day — consistency beats intensity.",
          "Write down your goal before you start, so you can tell whether your work on {keyword} is on track.",
          "Keep a folder of examples you admire, and study one each week.",
          "Ask one experienced person to review your work each month.",
          "Time-box your sessions: 25 minutes of focus, then a short break.",
          "End each session by noting the next step, so you never start cold."
        ]
      },
      {
        id: "mistakes",
        min: "medium",
        headings: [
          "Common {Topic} Mistakes to Avoid",
          "What Most People Get Wrong About {Keyword}",
          "{N} {Topic} Mistakes (and How to Fix Them)",
          "Mistakes to Avoid",
          "What Most People Get Wrong"
        ],
        sentences: [
          "The most common mistake is rushing the setup. People jump in without a plan, then wonder why the results feel random.",
          "Another trap is copying someone else's method wholesale. What works for their situation may not fit yours — adapt the idea, do not clone it.",
          "Many beginners ignore the basics and chase advanced tricks. Strong fundamentals done well beat shortcuts every time.",
          "Overcomplicating is a classic error. If your process needs a manual to explain, simplify it until a beginner could follow it.",
          "People also quit too early. The first weeks feel slow, but that is when the foundation is being built.",
          "A subtler mistake is never measuring anything. Without a simple way to track progress, you cannot tell what is working and what is not.",
          "Finally, do not work in isolation. The fastest way to improve at {topic} is to see how others do it and borrow what fits."
        ]
      },
      {
        id: "advanced",
        min: "long",
        headings: [
          "Taking Your {Keyword} Further",
          "Beyond the Basics: Levelling Up Your {Topic}",
          "How to Keep Improving at {Topic}",
          "Going Further",
          "Beyond the Basics"
        ],
        sentences: [
          "Once the basics are solid, start refining. Small experiments — one change at a time — show you exactly what moves things forward.",
          "At this stage, your notes become your biggest asset. Patterns from your own work beat generic advice every time.",
          "Look for the edge cases. Handling the unusual situations is what separates competent work from excellent work.",
          "Build a simple system around it. When {keyword} becomes a routine instead of a project, the quality stays high with less effort.",
          "Teach or document your process. Writing down how you approach {topic} forces you to spot the gaps in your own thinking.",
          "Stay curious about new approaches, but test them before adopting them. Not every new idea survives contact with real work."
        ]
      }
    ],

    FAQ: [
      {
        q: "How long does it take to learn {topic}?",
        a: "Most people see real progress in three to four weeks of regular practice. The basics of {topic} are quick to pick up; the skill comes from repeating them. Short, frequent sessions work better than rare long ones."
      },
      {
        q: "Do I need special tools for {keyword}?",
        a: "No. The basics of {keyword} need little more than time and attention. Extra tools can help later, but they never replace the fundamentals."
      },
      {
        q: "What is the biggest mistake beginners make with {topic}?",
        a: "Rushing. Beginners often skip the setup and go straight to the hard parts. Slow down, learn the {topic} basics first, and the rest gets much easier."
      },
      {
        q: "How often should I practise {topic}?",
        a: "Three to four short sessions a week is a good rhythm for most people. The key is regularity — a habit you keep beats a burst you abandon."
      },
      {
        q: "Can I learn {topic} on my own?",
        a: "Yes, many people do. A clear guide, a bit of patience and honest self-review will take you a long way with {topic}. Feedback from others simply speeds the process up."
      },
      {
        q: "How do I know if I am getting better at {keyword}?",
        a: "Track one simple number — time spent, tasks finished, or errors made — and compare it week to week. If the trend moves the right way, your work on {keyword} is improving."
      }
    ],

    CONCLUSIONS: {
      informative: [
        "{Topic} is simpler than it looks once the basics are clear. Start with one small step, keep the habit regular, and let the results build. The guide above gives you everything you need to begin — the rest is practice."
      ],
      howto: [
        "You now have a complete starting plan for {topic}: the basics, the first steps, and the mistakes to avoid. Pick the first task, do it today, and come back tomorrow for the next one. That is how {keyword} gets built — one small step at a time."
      ],
      persuasive: [
        "The best time to start {topic} was a month ago; the second-best time is today. Use the plan above, keep it simple, and give yourself a few weeks. Your future self will be glad you started."
      ]
    },

    LENGTHS: {
      short: { label: "Short", words: "400–600", min: 400, max: 600, sections: 2, parasPerSection: 2, faq: 2 },
      medium: { label: "Medium", words: "700–1,000", min: 700, max: 1000, sections: 4, parasPerSection: 2, faq: 3 },
      long: { label: "Long", words: "1,050–1,400", min: 1050, max: 1400, sections: 5, parasPerSection: 3, faq: 3 }
    },

    SAMPLES: [
      { topic: "Best indoor plants for beginners", keyword: "indoor plants" },
      { topic: "How to brew pour over coffee at home", keyword: "pour over coffee" }
    ]
  };

  if (typeof module !== "undefined" && module.exports) module.exports = DATA;
  else root.SEO_DATA = DATA;
})(typeof window !== "undefined" ? window : globalThis);
