/* AI SEO Article Writer & Analyzer — generation + analysis logic.
   Pure functions (generateArticle, analyzeSEO) are exported for Node tests;
   DOM wiring only runs in the browser. */
(function (root, factory) {
  var DATA = typeof require === "function" ? require("./data.js") : root.SEO_DATA;
  var api = factory(DATA);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SEO_APP = api;
})(typeof window !== "undefined" ? window : globalThis, function (DATA) {
  "use strict";

  /* ---------- helpers ---------- */

  function hashStr(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return h;
  }

  function cap(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function fill(tpl, ctx) {
    return tpl
      .replace(/\{Topic\}/g, ctx.Topic)
      .replace(/\{topic\}/g, ctx.topic)
      .replace(/\{Keyword\}/g, ctx.Keyword)
      .replace(/\{keyword\}/g, ctx.keyword)
      .replace(/\{N\}/g, String(ctx.N));
  }

  /* Deterministic pick: same inputs always give the same article. */
  function pick(arr, salt) {
    if (!arr.length) return "";
    return arr[hashStr(salt) % arr.length];
  }

  /* Pick whole bank items (each is one or two self-contained sentences) for
     one paragraph. Items are classified by whether the FILLED text contains
     the keyword (the topic itself often contains it), so the keyword quota
     is honoured on real occurrences, not on template placeholders. When the
     article is already at its keyword quota, plain items are preferred;
     when it is below quota, keyword items are preferred. `used` holds items
     already placed in this section, so nothing repeats. Deterministic. */
  function buildParagraph(items, saltStr, ctx, countKwFn, kwTarget, kwUsed, progress, leadKw, used) {
    var filled = items.map(function (s) { return fill(s, ctx); });
    var pool = filled.filter(function (s) { return used.indexOf(s) === -1; });
    if (pool.length < 2) pool = filled.slice();
    var start = hashStr(saltStr) % pool.length;
    var order = [];
    for (var i = 0; i < pool.length; i++) order.push(pool[(start + i) % pool.length]);
    var chosen = [];
    var usedCount = kwUsed;
    var allowance = kwTarget * Math.max(progress, 0.2);
    var j, k;
    /* First paragraph of a section leads with an item that names the topic. */
    if (leadKw) {
      for (j = 0; j < order.length; j++) {
        if (countKwFn(order[j]) > 0) {
          chosen.push(order[j]);
          usedCount += countKwFn(order[j]);
          break;
        }
      }
    }
    for (j = 0; j < order.length && chosen.length < 2; j++) {
      if (chosen.indexOf(order[j]) !== -1) continue;
      k = countKwFn(order[j]);
      if (k === 0 || usedCount < allowance) { chosen.push(order[j]); usedCount += k; }
    }
    for (j = 0; j < order.length && chosen.length < 2; j++) {
      if (chosen.indexOf(order[j]) === -1) { chosen.push(order[j]); usedCount += countKwFn(order[j]); }
    }
    return { text: chosen.join(" "), kwAdded: usedCount - kwUsed, chosen: chosen };
  }

  function countWords(text) {
    var m = text.trim().match(/\S+/g);
    return m ? m.length : 0;
  }

  function countSentences(text) {
    var m = text.match(/[^.!?]+[.!?]+/g);
    return m ? m.length : (text.trim() ? 1 : 0);
  }

  function countSyllables(word) {
    var w = word.toLowerCase().replace(/[^a-z]/g, "");
    if (!w) return 0;
    if (w.length <= 3) return 1;
    var groups = w.match(/[aeiouy]+/g);
    var n = groups ? groups.length : 1;
    if (w.slice(-1) === "e") n -= 1;
    if (w.slice(-2) === "es" || w.slice(-2) === "ed") n -= 0; /* keep simple */
    return Math.max(1, n);
  }

  function fleschEase(text) {
    var words = countWords(text);
    var sentences = countSentences(text);
    if (!words || !sentences) return 0;
    var syllables = 0;
    text.split(/\s+/).forEach(function (w) { syllables += countSyllables(w); });
    return 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  }

  function fleschLabel(score) {
    if (score >= 90) return "Very easy to read";
    if (score >= 80) return "Easy to read";
    if (score >= 70) return "Fairly easy to read";
    if (score >= 60) return "Standard — plain English";
    if (score >= 50) return "Fairly difficult";
    if (score >= 30) return "Difficult";
    return "Very difficult";
  }

  /* ---------- article generation ---------- */

  var LENGTH_ORDER = ["short", "medium", "long"];

  function generateArticle(input) {
    var topic = (input.topic || "").trim();
    var keyword = (input.keyword || "").trim();
    if (!topic) throw new Error("Topic is required.");
    if (!keyword) throw new Error("Main keyword is required.");
    var length = DATA.LENGTHS[input.length] ? input.length : "medium";
    var tone = DATA.INTRO_OPENERS[input.tone] ? input.tone : "informative";
    var seed = input.seed || 0;
    var spec = DATA.LENGTHS[length];

    var ctx = {
      topic: topic.toLowerCase(),
      Topic: cap(topic),
      keyword: keyword.toLowerCase(),
      Keyword: cap(keyword),
      N: pick(["5", "7", "10"], topic + keyword + seed + ":n")
    };
    var salt = function (s) { return topic + "|" + keyword + "|" + seed + "|" + s; };

    /* Keyword quota: aim for ~1.5% density. Track uses while building. */
    var kwTarget = Math.round(spec.max * 0.015);
    var kwUsed = 0;
    var countKw = function (text) {
      var re = new RegExp(escapeRegExp(ctx.keyword), "gi");
      var m = text.match(re);
      return m ? m.length : 0;
    };
    function escapeRegExp(s) {
      return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    /* Title + meta — the title must contain the keyword; if the picked
       template does not (topic without the keyword), re-pick from the
       keyword templates, else prefix the keyword. */
    var title = fill(pick(DATA.TITLE_TEMPLATES, salt("title")), ctx);
    if (title.toLowerCase().indexOf(ctx.keyword) === -1) {
      var kwTitles = DATA.TITLE_TEMPLATES.filter(function (t) {
        return t.indexOf("{Keyword}") !== -1 || t.indexOf("{keyword}") !== -1;
      });
      title = fill(pick(kwTitles, salt("title-kw")), ctx);
    }
    if (title.toLowerCase().indexOf(ctx.keyword) === -1) {
      title = ctx.Keyword + ": " + title;
    }
    kwUsed += countKw(title);
    var meta = fill(pick(DATA.META_TEMPLATES, salt("meta")), ctx);
    if (meta.length > 160) {
      var cut = meta.slice(0, 157);
      meta = cut.slice(0, cut.lastIndexOf(" ")) + "…";
    }
    kwUsed += countKw(meta);

    /* Intro: opener (tone) + second paragraph */
    var intro = [];
    var p1 = fill(pick(DATA.INTRO_OPENERS[tone], salt("intro1")), ctx);
    intro.push(p1); kwUsed += countKw(p1);
    var p2 = fill(pick(DATA.INTRO_SECOND, salt("intro2")), ctx);
    intro.push(p2); kwUsed += countKw(p2);

    /* Sections */
    var sections = [];
    var eligible = DATA.SECTIONS.filter(function (s) {
      return LENGTH_ORDER.indexOf(s.min) <= LENGTH_ORDER.indexOf(length);
    }).slice(0, spec.sections);

    var totalSentences = spec.sections * spec.parasPerSection * 3;
    var sentBuilt = 0;

    eligible.forEach(function (sec, si) {
      /* Heading: prefer a variant without the keyword once past half quota. */
      var heading = fill(pick(sec.headings, salt("h:" + sec.id)), ctx);
      if (countKw(heading) > 0 && kwUsed > kwTarget * 0.5) {
        var plainHeadings = sec.headings
          .map(function (h) { return fill(h, ctx); })
          .filter(function (h) { return countKw(h) === 0; });
        if (plainHeadings.length) heading = plainHeadings[hashStr(salt("h2:" + sec.id)) % plainHeadings.length];
      }
      kwUsed += countKw(heading);
      var usedInSection = [];
      var paras = [];
      for (var p = 0; p < spec.parasPerSection; p++) {
        var progress = totalSentences ? sentBuilt / totalSentences : 0;
        var built = buildParagraph(sec.sentences, salt("s:" + sec.id + ":" + p), ctx, countKw, kwTarget, kwUsed, progress, p === 0, usedInSection);
        paras.push(built.text);
        kwUsed += built.kwAdded;
        sentBuilt += 3;
        usedInSection = usedInSection.concat(built.chosen);
      }
      var section = { heading: heading, paras: paras };
      if (sec.list && LENGTH_ORDER.indexOf(length) >= 1) {
        var start = hashStr(salt("list:" + sec.id)) % sec.list.length;
        var items = [];
        for (var i = 0; i < 4; i++) items.push(fill(sec.list[(start + i) % sec.list.length], ctx));
        section.list = items;
        items.forEach(function (it) { kwUsed += countKw(it); });
      }
      if (sec.checklist && LENGTH_ORDER.indexOf(length) >= 1) {
        section.checklist = sec.checklist.map(function (c) { return fill(c, ctx); });
        section.checklist.forEach(function (it) { kwUsed += countKw(it); });
      }
      sections.push(section);
    });

    /* FAQ */
    var faqStart = hashStr(salt("faq")) % DATA.FAQ.length;
    var faq = [];
    for (var f = 0; f < spec.faq; f++) {
      var item = DATA.FAQ[(faqStart + f) % DATA.FAQ.length];
      var q = fill(item.q, ctx);
      var a = fill(item.a, ctx);
      faq.push({ q: q, a: a });
      kwUsed += countKw(a);
    }

    /* Conclusion */
    var conclusion = fill(pick(DATA.CONCLUSIONS[tone], salt("conclusion")), ctx);
    kwUsed += countKw(conclusion);

    var article = {
      input: { topic: topic, keyword: keyword, length: length, tone: tone, seed: seed },
      title: title,
      meta: meta,
      intro: intro,
      sections: sections,
      faq: faq,
      conclusion: conclusion,
      kwUsed: kwUsed
    };
    article.plainText = toPlainText(article);
    article.markdown = toMarkdown(article);
    return article;
  }

  function bodyText(article) {
    var parts = [article.title, article.meta]
      .concat(article.intro)
      .concat(article.sections.map(function (s) {
        return [s.heading].concat(s.paras, s.list || [], s.checklist || []).join(" ");
      }))
      .concat(article.faq.map(function (f) { return f.q + " " + f.a; }))
      .concat([article.conclusion]);
    return parts.join(" ");
  }

  function toPlainText(a) {
    var out = [a.title, "", a.meta, ""];
    a.intro.forEach(function (p) { out.push(p, ""); });
    a.sections.forEach(function (s) {
      out.push(s.heading, "");
      s.paras.forEach(function (p) { out.push(p, ""); });
      (s.list || []).forEach(function (li) { out.push("• " + li); });
      if (s.list) out.push("");
      (s.checklist || []).forEach(function (li) { out.push("☐ " + li); });
      if (s.checklist) out.push("");
    });
    out.push("FAQ", "");
    a.faq.forEach(function (f) { out.push("Q: " + f.q, "A: " + f.a, ""); });
    out.push(a.conclusion);
    return out.join("\n");
  }

  function toMarkdown(a) {
    var out = ["# " + a.title, "", "> " + a.meta, ""];
    a.intro.forEach(function (p) { out.push(p, ""); });
    a.sections.forEach(function (s) {
      out.push("## " + s.heading, "");
      s.paras.forEach(function (p) { out.push(p, ""); });
      (s.list || []).forEach(function (li) { out.push("- " + li); });
      if (s.list) out.push("");
      (s.checklist || []).forEach(function (li) { out.push("- [ ] " + li); });
      if (s.checklist) out.push("");
    });
    out.push("## FAQ", "");
    a.faq.forEach(function (f) { out.push("### " + f.q, "", f.a, ""); });
    out.push(a.conclusion);
    return out.join("\n");
  }

  /* ---------- SEO analysis ---------- */

  function analyzeSEO(article) {
    var keyword = article.input.keyword.toLowerCase();
    var text = bodyText(article);
    var words = countWords(text);
    var sentences = countSentences(text);
    var ease = fleschEase(text);
    var re = new RegExp(escapeRegExp(keyword), "gi");
    var kwCount = (text.match(re) || []).length;
    var density = words ? (kwCount / words) * 100 : 0;

    var titleLen = article.title.length;
    var titleHasKw = article.title.toLowerCase().indexOf(keyword) !== -1;
    var metaLen = article.meta.length;

    var h2Total = article.sections.length;
    var h2WithKw = article.sections.filter(function (s) {
      return s.heading.toLowerCase().indexOf(keyword) !== -1;
    }).length;

    var firstWords = text.split(/\s+/).slice(0, 100).join(" ").toLowerCase();
    var firstHasKw = firstWords.indexOf(keyword) !== -1;
    var firstKwPos = -1;
    var idx = text.toLowerCase().indexOf(keyword);
    if (idx !== -1) firstKwPos = countWords(text.slice(0, idx)) + 1;

    var longSentences = 0;
    text.split(/(?<=[.!?])\s+/).forEach(function (s) {
      if (countWords(s) > 20) longSentences += 1;
    });

    var longParas = article.sections.reduce(function (n, s) {
      return n + s.paras.filter(function (p) { return countSentences(p) > 4; }).length;
    }, 0);

    var spec = DATA.LENGTHS[article.input.length];

    /* --- per-metric scores (0-100) --- */
    function scoreLength() {
      if (words >= spec.min && words <= spec.max) return 100;
      if (words < spec.min) return Math.max(40, Math.round(100 * words / spec.min));
      return Math.max(50, Math.round(100 - ((words - spec.max) / spec.max) * 100));
    }
    function scoreDensity() {
      if (density >= 1.0 && density <= 2.0) return 100;
      if ((density >= 0.8 && density < 1.0) || (density > 2.0 && density <= 2.5)) return 80;
      if ((density >= 0.5 && density < 0.8) || (density > 2.5 && density <= 3.0)) return 55;
      return 30;
    }
    function scoreReadability() {
      if (ease >= 60 && ease <= 70) return 100;
      if ((ease >= 50 && ease < 60) || (ease > 70 && ease <= 80)) return 85;
      if ((ease >= 40 && ease < 50) || (ease > 80 && ease <= 90)) return 65;
      return 45;
    }
    function scoreTitle() {
      var s = titleHasKw ? 60 : 0;
      if (titleLen >= 40 && titleLen <= 60) s += 40;
      else if (titleLen >= 30 && titleLen < 40 || titleLen > 60 && titleLen <= 70) s += 20;
      return s;
    }
    function scoreMeta() {
      if (metaLen >= 120 && metaLen <= 160) return 100;
      if ((metaLen >= 100 && metaLen < 120) || (metaLen > 160 && metaLen <= 180)) return 70;
      return 40;
    }
    function scoreHeadings() {
      if (h2WithKw >= 3) return 100;
      if (h2WithKw === 2) return 75;
      if (h2WithKw === 1) return 50;
      return 25;
    }
    function scoreIntro() {
      return firstHasKw ? 100 : 50;
    }

    var metrics = [
      { id: "length", label: "Article length", value: words + " words", detail: "Target " + spec.min + "–" + spec.max + " for a " + spec.label.toLowerCase() + " article", score: scoreLength() },
      { id: "density", label: "Keyword density", value: density.toFixed(1) + "%", detail: kwCount + " uses of “" + keyword + "” — aim for 1.0–2.0%", score: scoreDensity() },
      { id: "readability", label: "Readability", value: Math.round(ease) + " / 100", detail: fleschLabel(ease) + " (Flesch reading ease)", score: scoreReadability() },
      { id: "title", label: "SEO title", value: titleLen + " characters", detail: titleHasKw ? "Contains the keyword" : "Missing the keyword", score: scoreTitle() },
      { id: "meta", label: "Meta description", value: metaLen + " characters", detail: "Aim for 120–160 characters", score: scoreMeta() },
      { id: "headings", label: "Keyword in subheadings", value: h2WithKw + " of " + h2Total + " H2s", detail: "Search engines weight keywords in headings", score: scoreHeadings() },
      { id: "intro", label: "Keyword in first 100 words", value: firstHasKw ? "Yes — word " + firstKwPos : "No — first at word " + firstKwPos, detail: "Put the topic up front", score: scoreIntro() }
    ];

    var weights = { length: 20, density: 20, readability: 20, title: 10, meta: 10, headings: 10, intro: 10 };
    var overall = 0;
    metrics.forEach(function (m) { overall += m.score * (weights[m.id] / 100); });
    overall = Math.round(overall);

    var grade = overall >= 90 ? "Excellent" : overall >= 75 ? "Good" : overall >= 60 ? "Needs work" : "Poor";

    /* --- concrete suggestions --- */
    var suggestions = [];
    if (density < 1.0) {
      var need = Math.max(1, Math.round(words * 0.015) - kwCount);
      suggestions.push({ level: "fix", text: "Keyword density is " + density.toFixed(1) + "% — add “" + keyword + "” about " + need + " more time" + (need > 1 ? "s" : "") + " in the body to reach ~1.5%. One in the second paragraph and one in a subheading works well." });
    } else if (density > 2.0) {
      var extra = kwCount - Math.round(words * 0.015);
      suggestions.push({ level: "fix", text: "Keyword density is " + density.toFixed(1) + "% — remove about " + Math.max(1, extra) + " use" + (extra > 1 ? "s" : "") + " (aim for 1–2%) so the text reads naturally and avoids keyword stuffing." });
    }
    if (words < spec.min) {
      suggestions.push({ level: "fix", text: "The article is " + words + " words — add about " + (spec.min - words) + " words to reach the " + spec.min + "–" + spec.max + " range for a " + spec.label.toLowerCase() + " article. One more section with two paragraphs would do it." });
    } else if (words > spec.max) {
      suggestions.push({ level: "improve", text: "The article is " + words + " words — trim about " + (words - spec.max) + " words to stay inside the " + spec.min + "–" + spec.max + " range. Cut the weakest paragraph in each section first." });
    }
    if (ease < 60) {
      suggestions.push({ level: "fix", text: "Reading ease is " + Math.round(ease) + " — shorten the " + longSentences + " sentence" + (longSentences === 1 ? "" : "s") + " over 20 words and swap long words for plain ones. Aim for a score of 60–70." });
    } else if (ease > 80) {
      suggestions.push({ level: "improve", text: "Reading ease is " + Math.round(ease) + " — the text is very simple. For this topic you can add a little depth (one concrete example per section) without losing readers." });
    }
    if (!titleHasKw) {
      suggestions.push({ level: "fix", text: "Add the keyword to the title — it is the strongest on-page signal for this page." });
    } else if (titleLen < 40 || titleLen > 60) {
      suggestions.push({ level: "improve", text: "The title is " + titleLen + " characters — aim for 40–60 so it fits search results without being cut off." });
    }
    if (metaLen < 120) {
      suggestions.push({ level: "improve", text: "The meta description is " + metaLen + " characters — extend it to at least 120 so it fills the search snippet." });
    } else if (metaLen > 160) {
      suggestions.push({ level: "improve", text: "The meta description is " + metaLen + " characters — trim it to under 160 so it is not cut off in search results." });
    }
    if (h2WithKw < 2 && density <= 2.0) {
      suggestions.push({ level: "improve", text: "Only " + h2WithKw + " of " + h2Total + " subheadings contain the keyword — add it to 1–2 more H2s." });
    }
    if (!firstHasKw) {
      suggestions.push({ level: "fix", text: "The keyword first appears at word " + firstKwPos + " — move it into the first sentence so readers and search engines see the topic immediately." });
    }
    if (longParas > 0) {
      suggestions.push({ level: "improve", text: longParas + " paragraph" + (longParas > 1 ? "s are" : " is") + " longer than 4 sentences — split them so the page scans easily on a phone." });
    }
    suggestions.push({ level: "improve", text: "Add 2–3 internal links to related pages on your site, using “" + keyword + "” or a close variation as the link text." });
    suggestions.push({ level: "improve", text: "Add one image with alt text containing “" + keyword + "” — it helps image search and accessibility." });
    if (suggestions.length === 2) {
      suggestions.unshift({ level: "good", text: "All core checks pass — this article is ready to publish. Track which queries it ranks for in the first 30 days." });
    }

    return {
      words: words,
      sentences: sentences,
      readingTimeMin: Math.max(1, Math.ceil(words / 200)),
      ease: Math.round(ease * 10) / 10,
      easeLabel: fleschLabel(ease),
      kwCount: kwCount,
      density: Math.round(density * 10) / 10,
      titleLen: titleLen,
      metaLen: metaLen,
      h2WithKw: h2WithKw,
      h2Total: h2Total,
      firstKwPos: firstKwPos,
      longSentences: longSentences,
      metrics: metrics,
      overall: overall,
      grade: grade,
      suggestions: suggestions
    };
  }

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /* ---------- rendering (browser) ---------- */

  function highlightKeyword(html, keyword) {
    if (!keyword) return html;
    var re = new RegExp("(" + escapeRegExp(esc(keyword)) + ")", "gi");
    return html.replace(re, "<mark>$1</mark>");
  }

  function articleHTML(article, opts) {
    var kw = opts && opts.highlight ? article.input.keyword : "";
    var h = function (t) { return kw ? highlightKeyword(esc(t), kw) : esc(t); };
    var out = [];
    out.push('<p class="art-kicker">Sample article · ' + esc(article.input.length) + ' · ' + esc(article.input.tone) + ' tone</p>');
    out.push("<h1>" + h(article.title) + "</h1>");
    out.push('<p class="art-meta-desc">' + h(article.meta) + "</p>");
    article.intro.forEach(function (p) { out.push("<p>" + h(p) + "</p>"); });
    article.sections.forEach(function (s) {
      out.push("<h2>" + h(s.heading) + "</h2>");
      s.paras.forEach(function (p) { out.push("<p>" + h(p) + "</p>"); });
      if (s.list) {
        out.push("<ul>" + s.list.map(function (li) { return "<li>" + h(li) + "</li>"; }).join("") + "</ul>");
      }
      if (s.checklist) {
        out.push('<ul class="checklist">' + s.checklist.map(function (li) { return "<li>" + h(li) + "</li>"; }).join("") + "</ul>");
      }
    });
    out.push("<h2>Frequently asked questions</h2>");
    article.faq.forEach(function (f) {
      out.push('<p class="faq-q">' + h(f.q) + "</p>");
      out.push("<p>" + h(f.a) + "</p>");
    });
    out.push("<h2>Bottom line</h2>");
    out.push("<p>" + h(article.conclusion) + "</p>");
    return out.join("\n");
  }

  function metricStatus(score) {
    if (score >= 85) return "good";
    if (score >= 60) return "warn";
    return "poor";
  }

  /* ---------- DOM wiring ---------- */

  function init() {
    var $ = function (id) { return document.getElementById(id); };
    var state = {
      topic: "", keyword: "", length: "medium", tone: "informative",
      seed: 0, highlight: false, article: null, analysis: null
    };

    function setSeg(groupId, value) {
      document.querySelectorAll("#" + groupId + " button").forEach(function (b) {
        b.classList.toggle("active", b.dataset.value === value);
        b.setAttribute("aria-pressed", b.dataset.value === value ? "true" : "false");
      });
    }

    function validate() {
      var ok = true;
      var topic = $("topicInput").value.trim();
      var keyword = $("keywordInput").value.trim();
      $("topicError").textContent = topic ? "" : "Enter a topic first.";
      $("topicInput").classList.toggle("invalid", !topic);
      $("keywordError").textContent = keyword ? "" : "Enter the main keyword.";
      $("keywordInput").classList.toggle("invalid", !keyword);
      if (!topic || !keyword) ok = false;
      return ok;
    }

    function generate(fromSample) {
      if (!validate()) return;
      state.topic = $("topicInput").value.trim();
      state.keyword = $("keywordInput").value.trim();
      try {
        state.article = generateArticle({
          topic: state.topic, keyword: state.keyword,
          length: state.length, tone: state.tone, seed: state.seed
        });
        state.analysis = analyzeSEO(state.article);
        render();
        $("articleCard").scrollIntoView({ behavior: "smooth", block: "nearest" });
      } catch (e) {
        $("topicError").textContent = e.message;
      }
    }

    function render() {
      var a = state.article, an = state.analysis;
      if (!a || !an) return;
      $("emptyState").style.display = "none";
      $("articleCard").style.display = "block";
      $("scoreCard").style.display = "block";
      $("fixCard").style.display = "block";

      /* score ring */
      var ring = $("scoreRingFg");
      var C = 2 * Math.PI * 52;
      ring.style.strokeDasharray = C;
      ring.style.strokeDashoffset = C * (1 - an.overall / 100);
      ring.setAttribute("class", "ring-fg score-" + metricStatus(an.overall));
      $("scoreNum").textContent = an.overall;
      $("scoreGrade").textContent = an.grade;
      $("scoreGrade").setAttribute("class", "grade score-" + metricStatus(an.overall));

      /* metrics */
      $("metricList").innerHTML = an.metrics.map(function (m) {
        var st = metricStatus(m.score);
        return '<li class="metric">' +
          '<div class="metric-head"><span class="metric-label">' + esc(m.label) + '</span>' +
          '<span class="metric-value">' + esc(m.value) + '</span></div>' +
          '<div class="bar"><span class="bar-fill ' + st + '" style="width:' + m.score + '%"></span></div>' +
          '<div class="metric-detail">' + esc(m.detail) + ' · ' + m.score + '/100</div></li>';
      }).join("");

      /* suggestions */
      $("suggestionList").innerHTML = an.suggestions.map(function (s) {
        var icon = s.level === "fix" ? "●" : s.level === "good" ? "✓" : "○";
        return '<li class="sugg ' + s.level + '"><span class="sugg-icon" aria-hidden="true">' + icon + "</span><span>" + esc(s.text) + "</span></li>";
      }).join("");

      /* article */
      $("articleHtml").innerHTML = articleHTML(a, { highlight: state.highlight });
      $("statWords").textContent = an.words + " words";
      $("statTime").textContent = "~" + an.readingTimeMin + " min read";
      $("statKw").textContent = an.kwCount + "× “" + a.input.keyword.toLowerCase() + "”";
      $("highlightToggle").setAttribute("aria-pressed", state.highlight ? "true" : "false");
      $("highlightToggle").classList.toggle("active", state.highlight);
    }

    function copyText(text, btn, label) {
      function done() {
        var old = btn.textContent;
        btn.textContent = "Copied ✓";
        setTimeout(function () { btn.textContent = old; }, 1600);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
      } else { fallbackCopy(text); done(); }
      function fallbackCopy(t) {
        var ta = document.createElement("textarea");
        ta.value = t;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch (e) { /* noop */ }
        document.body.removeChild(ta);
      }
    }

    $("generateBtn").addEventListener("click", function () { state.seed = 0; generate(); });
    $("regenerateBtn").addEventListener("click", function () {
      if (!state.article) { generate(); return; }
      state.seed = (state.seed + 1) % 997;
      generate();
    });
    $("highlightToggle").addEventListener("click", function () {
      state.highlight = !state.highlight;
      if (state.article) render();
    });
    $("copyTextBtn").addEventListener("click", function () {
      if (state.article) copyText(state.article.plainText, $("copyTextBtn"));
    });
    $("copyHtmlBtn").addEventListener("click", function () {
      if (state.article) copyText(articleHTML(state.article, { highlight: false }), $("copyHtmlBtn"));
    });
    $("downloadMdBtn").addEventListener("click", function () {
      if (!state.article) return;
      var blob = new Blob([state.article.markdown], { type: "text/markdown" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = state.article.input.keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-article.md";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    });

    document.querySelectorAll("#lengthSeg button").forEach(function (b) {
      b.addEventListener("click", function () {
        state.length = b.dataset.value;
        setSeg("lengthSeg", state.length);
        if (state.article) generate();
      });
    });
    document.querySelectorAll("#toneSeg button").forEach(function (b) {
      b.addEventListener("click", function () {
        state.tone = b.dataset.value;
        setSeg("toneSeg", state.tone);
        if (state.article) generate();
      });
    });
    document.querySelectorAll(".sample-chip").forEach(function (b) {
      b.addEventListener("click", function () {
        var s = DATA.SAMPLES[parseInt(b.dataset.sample, 10)];
        $("topicInput").value = s.topic;
        $("keywordInput").value = s.keyword;
        state.seed = 0;
        generate(true);
      });
    });
    ["topicInput", "keywordInput"].forEach(function (id) {
      $(id).addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); state.seed = 0; generate(); }
      });
    });

    setSeg("lengthSeg", state.length);
    setSeg("toneSeg", state.tone);
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }

  return {
    generateArticle: generateArticle,
    analyzeSEO: analyzeSEO,
    fleschEase: fleschEase,
    countWords: countWords,
    countSyllables: countSyllables,
    articleHTML: articleHTML,
    toPlainText: toPlainText,
    toMarkdown: toMarkdown,
    esc: esc,
    DATA: DATA
  };
});
