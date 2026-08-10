# GymTune RAG Knowledge Vault: Research Report

**Date:** 2026-08-09
**Scope:** How to build the gym tribal knowledge RAG vault from sourcing to on-device retrieval

## Recommended Concrete Stack (Read This First)

**Sources to ship:** Wikipedia (CC BY-SA 4.0) + Wikidata (CC0) for anatomy/physiology background; wger exercise database (CC BY-SA 3.0, attribution + share-alike, via `https://wger.de/api/v2/` public endpoints without auth) for formal exercise name/muscle/equipment facts; yuhonas Free Exercise DB (Unlicense, public domain, 800+ exercises, `https://github.com/yuhonas/free-exercise-db`) for exercise name/instructions/images; plus 200-400 pages of original writing that paraphrases and cites the tribal knowledge on MEV/MAV/MRV, RPE/RIR, autoregulation, deload, plateau, substitution, form cues, and program structure. Do not ship Renaissance Periodization, Stronger by Science, ExRx, or Reddit wikis/threads verbatim. **Chunker:** Python offline: `MarkdownHeaderTextSplitter` to preserve heading hierarchy, then `RecursiveCharacterTextSplitter` with `chunk_size=256` tokens (~1000 chars), `chunk_overlap=20-30` tokens (10% overlap), prepend the heading path (`# Program Design > Volume Landmarks > MEV`) to every chunk for embedding, and add Anthropic contextual retrieval (one LLM call per chunk, 50-100 token prefix that situates the chunk in the full document) because it is a one-time offline cost and cuts retrieval failures 49% alone, 67% with reranking. **Embedding model:** `Snowflake/snowflake-arctic-embed-s` (33M params, 384 dims, 512 tokens, Apache 2.0) or `BAAI/bge-small-en-v1.5` (33.4M, 384 dims, 512 tokens, MIT) as primary; both beat `sentence-transformers/all-MiniLM-L6-v2` (22.7M, 384 dims, 256-token truncation, Apache 2.0, MTEB 56.3) on retrieval and run in <10ms CPU. If you keep `nomic-embed-text-v1.5` (137M, 768 dims, 8192 tokens, Apache 2.0, MTEB 62.39, Matryoshka), budget 2x storage and add the mandatory `search_document:` / `search_query:` prefixes. **On-device inference route:** `react-native-executorch` `useTextEmbeddings` with `models.text_embedding.all_minilm_l6_v2()` (now supports `all-MiniLM-L6-v2` and multilingual embeddings, powered by ExecuTorch `.pte` export) is the only route with a shipped React Native hook proved in `software-mansion-labs/react-native-rag` + `Private Mind` app. Fallback proven route: `onnxruntime-react-native` 1.24.3 + `@automatalabs/react-native-transformers` (Expo config plugin, Metro alias) running `Xenova/all-MiniLM-L6-v2-onnx` quantized (~23-80MB). `llama.rn` embedding mode (`initLlama({embedding:true})` + `nomic-embed-text-v1.5-GGUF` Q8_0) is valid but forces a second GGUF context beside Gemma 3 1B and doubles RAM. **Storage:** Bundled JSON of `Float32Array` vectors is fine for <1000 chunks (384-dim = 1.5 MB, 768-dim = 3.0 MB raw; JSON on disk ~4-8 MB). Quantize to int8 if you want 0.4-0.8 MB. Do not add `sqlite-vec` unless you eject from Expo Go: `expo-sqlite` has no vector search; `op-sqlite`/`react-native-nitro-sqlite` + `sqlite-vec` or `@react-native-rag/op-sqlite` (libSQL) requires a dev client/prebuild. **Retrieval:** Brute-force cosine (dot product on L2-normalized vectors) + lightweight JS BM25 (`okapibm25` or `wink-bm25-text-search`) fused by Reciprocal Rank Fusion; reranking with a cross-encoder is not worth it on device for this corpus size (quantized int8 loses 1-2 NDCG, latency scales linearly N, only worth it for top-5 after RRF). Evaluate on 60-80 hand-built golden questions (RAGAS context precision/recall + hit@k), with rule-based query rewriting for "stuck at 185 bench 3 weeks" -> "bench press plateau progression".

---

## 1. Sources, With License Status

### 1.1 Renaissance Periodization (RP)
- **URL:** `https://rpstrength.com/pages/terms-of-service` (shop), `https://www.renaissance.com/terms-of-use/` (education site)
- **Covers:** Hypertrophy volume landmarks (MEV/MAV/MRV), periodization, diet, training templates. The tribal knowledge gold is Mike Israetel articles, RP hypertrophy guides, volume landmark tables.
- **License:** "Permission is granted for use of the content of this website under the Creative Commons License. We would greatly appreciate attribution" and "The materials ... are protected by applicable copyright and trade mark law." (`https://rpstrength.com/pages/terms-of-service`). No CC version is named (not CC BY-SA 4.0, not CC0). No explicit commercial or derivative grant.
- **Robots/ToS:** Standard copyright + trademark, no warranties, site terms can change without notice.
- **Verdict: CANNOT SHIP VERBATIM.** The CC mention is vague and unenforceable as a license grant; the same page asserts full copyright. Treat as **all rights reserved**. Paraphrase-and-cite is the only defensible path. Write your own MEV/MAV/MRV section and cite RP as a source (e.g., "Volume landmarks per Israetel/RP"). If you need a quote, use <90 words, attribution, fair use, but do not bundle scraped HTML.
- **Source:** https://rpstrength.com/pages/terms-of-service

### 1.2 Stronger by Science (SBS)
- **URL:** `https://www.strongerbyscience.com/disclaimer/` , `https://www.strongerbyscience.com/articles/`
- **Covers:** Evidence-based program design, volume/intensity meta-analyses, plateau/deload science, form deep dives. Podcast transcripts are also tribal knowledge.
- **License:** "All intellectual property rights to content on this website are vested in Stronger By Science. Copying, disseminating and any other use of these materials is not permitted without the written permission of Stronger By Science, except and only insofar as otherwise stipulated in regulations of mandatory law (such as the right to quote), unless the specific content dictates otherwise." (`https://www.strongerbyscience.com/disclaimer/`)
- **Verdict: CANNOT SHIP.** Strict all-rights-reserved. The SBS team (Greg Nuckols/Eric Trexler) sells programs and Mass research review; they do not open-license articles. You must **summarize in your own words and cite** (e.g., "SBS recommends ... [link]"). Do not scrape `sbspod.com` transcripts.
- **Source:** https://www.strongerbyscience.com/disclaimer/

### 1.3 r/weightroom and r/fitness wikis + Reddit threads
- **URLs:** `https://www.reddit.com/r/Fitness/wiki/`, `https://www.reddit.com/r/weightroom/wiki/`; API: `https://www.reddit.com/dev/api/`
- **Covers:** Program comparisons (nSuns, 5/3/1, GZCL), plateau FAQs, deload guides, equipment substitutions, form cue compilations. High tribal density, low editorial control.
- **License (user content):** Reddit User Agreement (effective 2024-09-16, last revised 2024-08-16) states users grant Reddit a license, and Reddit grants each user a "personal, non-transferable, non-exclusive, revocable, limited license to install and use a copy of our mobile application ... and to access and use the Services" (filed at `https://oag.ca.gov/.../Reddit_User_Agreement.pdf`). That is a **use license, not a content redistribution license to you**. Each Reddit post/comment remains owned by its author and licensed to Reddit, not to you.
- **Reddit Data API / scraping terms as of 2024-2026:**
  - Commercial access now requires a contract: "Commercial entities should have to pay for data access through bespoke arrangements" (CEO Steve Huffman, Axios 2024-05-09, https://www.axios.com/2024/05/09/reddit-public-data-content-policy-ai-privacy).
  - Data API Terms: "You may not use content on Reddit as an input for any model training without explicit consent ... Commercial use of any model trained with Reddit data is prohibited without explicit approval" (https://support.reddithelp.com/hc/en-us/articles/14945211791892-Developer-Platform-Accessing-Reddit-Data).
  - Responsible Builder Policy (2026-06-05): "You must not sell, license, share, or otherwise commercialize Reddit data without express written approval" (https://support.reddithelp.com/hc/en-us/articles/42728983564564-Responsible-Builder-Policy).
  - Public Content Policy: "To crawl Reddit or have access to reading content, you need to have some sort of agreement" (https://techcrunch.com/2024/05/09/reddit-locks-down-its-public-data-in-new-content-policy-says-use-now-requires-a-contract).
  - API pricing widely reported as $0.24 per 1,000 calls, $12K/year minimum for commercial use (https://redreplier.com/en/blog/reddit-api-pricing , https://www.xpoz.ai/blog/guides/reddit-api-pricing-tiers-and-alternatives/). Free tier 100 QPM per OAuth client for personal bots/moderator tools only.
  - Only authorized research channel is Reddit for Researchers (RFR); using dev tools/APIs for academic research violates policy.
- **robots.txt:** Updated 2024-06 to block AI crawlers without agreement: "Reddit is revising robots.txt to control automated web bots ... blocking bots that do not comply with Public Content Policy or lack an agreement" (https://web.swipeinsight.app/posts/reddit-updates-robots-txt-to-block-ai-crawlers-7937, https://techcrunch.com/2024/06/25/reddits-upcoming-changes-attempt-to-safeguard-the-platform-against-ai-crawlers). Reddit sued Anthropic and Perplexity for bypassing robots.txt (https://alternativeto.net/news/2025/6/reddit-sues-anthropic ...). Legal theories now include DMCA circumvention + breach of contract (https://technologylaw.fkks.com/post/102lz1g/is-your-sites-robots-txt-giving-content-to-ai-models-for-free).
- **Verdict: CANNOT SHIP REDDIT TEXT.** Scraping or API-pulling wiki or thread text and bundling derived vectors/text in a shipped mobile app is **not legally defensible** without a Reddit data licensing contract (>$12K/year, bespoke, likely >$50K enterprise). The free tier is for personal/moderation use, not redistribution. Even RAG embeddings of Reddit text are derivative commercial use. **What to do instead:** Read the wikis for structure, then write original prose that synthesizes the consensus and cite the wiki URL as a source. Do not quote more than a sentence under fair use. If you want community voice, link out to Reddit rather than bundle.
- **Sources:** https://support.reddithelp.com/hc/en-us/articles/14945211791892-Developer-Platform-Accessing-Reddit-Data , https://support.reddithelp.com/hc/en-us/articles/42728983564564-Responsible-Builder-Policy , https://www.axios.com/2024/05/09/reddit-public-data-content-policy-ai-privacy , https://techcrunch.com/2024/05/09/reddit-locks-down-its-public-data-in-new-content-policy-says-use-now-requires-a-contract , https://www.xpoz.ai/blog/guides/reddit-api-pricing-tiers-and-alternatives/

### 1.4 ExRx.net
- **URL:** `https://exrx.net/` , terms at `https://exrx.net/Notes/Legal` and `https://exrx.net/Notes/License`
- **Covers:** Exercise directory, kinesiology, muscle mechanics, stretching. Useful as a fact-check for insertion/origin, but tribal wisdom is thin.
- **License:** "The contents of ExRx.net are owned by ExRx.net, LLC and protected by United States copyright laws... All copyrights on ExRx content apply and will be enforced." "Automated scraping or manual copying of Our Content is prohibited for either personal or commercial use including training AI models." "It is not within fair use to sell any of Our Content or pass it off as your own." (`https://exrx.net/Notes/Legal`)
- **Verdict: CANNOT SHIP.** Explicit anti-scraping + anti-AI-training clause. Do not bundle. You may link to ExRx pages, but not embed their text/vectors.
- **Source:** https://exrx.net/Notes/Legal

### 1.5 Wikipedia and Wikidata
- **URLs:** `https://en.wikipedia.org/wiki/Wikipedia:Text_of_the_Creative_Commons_Attribution-ShareAlike_4.0_International_License` , `https://www.wikidata.org/wiki/Wikidata:Licensing`
- **Covers:** Anatomy, biomechanics, periodization definitions, energy systems, DOMS, supercompensation. Good for encyclopedic spine, not tribal nuance.
- **License:** Wikipedia text: **CC BY-SA 4.0** since 2023 (older edits CC BY-SA 3.0). Allows copying, adapting, remixing, redistributing even commercially if you give attribution and share alike. (https://creativecommons.org/2023/06/29/wikipedia-moves-to-cc-4-0-licenses/ , https://en.wikipedia.org/wiki/Wikipedia:Reusing_Wikipedia_content). Wikidata: **CC0** (public domain, no attribution required): "When any Wikidata user makes a contribution ... that user applies a CC0 license ... All data in Wikidata has a CC0 license" (https://www.wikidata.org/wiki/Wikidata:Licensing).
- **Verdict: CAN SHIP.** Bundling Wikipedia chunks as vectors + source text is allowed if you include attribution and CC BY-SA 4.0 notice and share alike for derivative text. Wikidata can be bundled with no restrictions. In practice, attribute per-chunk metadata: `{source: "Wikipedia", url, license: "CC BY-SA 4.0"}` and add a licenses screen.
- **Sources:** https://creativecommons.org/2023/06/29/wikipedia-moves-to-cc-4-0-licenses/ , https://www.wikidata.org/wiki/Wikidata:Licensing

### 1.6 wger (Workout Manager)
- **URLs:** Code `https://github.com/wger-project/wger` , docs `https://wger.readthedocs.io/` , API `https://wger.de/api/v2/`
- **Covers:** Exercise database (name, description, category, muscles, equipment, images), ingredients/nutrition. 230+ exercises with multilingual translations. Ideal for equipment-restricted substitution tables.
- **License:** Code **AGPL 3+** (or any later version). Initial exercise and ingredient data **CC BY-SA 3.0** (docs index: "The initial exercise and ingredient data is licensed additionally under a Creative Commons Attribution Share-Alike 3.0"). Images: CC BY-SA 4.0 catalog, each record includes `license` + `licenseAuthor`; some images from Wikipedia (check SOURCES files). (`https://wger.readthedocs.io/en/latest/` , `https://apify.com/parseforge/wger-exercise-database-scraper`)
- **API:** REST at `https://wger.de/api/v2/`, public endpoints (`/exercise`, `/exercisecategory`, `/equipment`, `/muscle`) accessible without auth; user-owned objects require API key. (https://wger.readthedocs.io/)
- **Verdict: CAN SHIP WITH CONDITIONS.** CC BY-SA 3.0 allows commercial use with attribution + share alike. If you bundle the wger exercise JSON/vectors, you must attribute wger and release your derived exercise dataset under CC BY-SA 3.0/4.0 (compatible). The share-alike does **not** infect your entire app code, only the adapted dataset, but it creates friction for a proprietary portfolio app (you must publish the adapted dataset under CC BY-SA). API fetch at runtime avoids bundling, but GymTune is offline-first so local bundling is required. AGPL applies only if you modify and run wger server code, not if you merely consume the CC BY-SA data via API. App-store exception exists for wger's own Flutter app (`https://github.com/wger-project/flutter` licensed AGPL 3+ with app-store exception), but does not extend to your app.
- **Sources:** https://wger.readthedocs.io/en/latest/ , https://github.com/wger-project/wger , https://github.com/wger-project/flutter

### 1.7 Free Exercise DB / yuhonas
- **URL:** `https://github.com/yuhonas/free-exercise-db` , frontend `https://yuhonas.github.io/free-exercise-db`
- **Covers:** 800+ exercises, each as individual JSON with `name`, `instructions`, `images`, `primaryMuscles`, `equipment`. Exercises browsable, structured, permissive.
- **License:** **Unlicense** (public domain). "Free Exercise DB is released under the Unlicense, placing it in the public domain ... you can freely copy, modify, publish, use, compile, sell, or distribute ... with no warranties" (https://github.com/yuhonas/free-exercise-db). Issues #2 and #12 discuss image licensing; the JSON data itself is Unlicense. Images are mostly open or user-contributed, but the repo treats them as public domain.
- **Verdict: CAN SHIP FREELY.** This is your cleanest exercise corpus. No attribution required (though attributing `yuhonas/free-exercise-db` is good form). Ideal base for equipment substitution knowledge. Combine with wger for richer muscle/equipment taxonomy.
- **Source:** https://github.com/yuhonas/free-exercise-db

### 1.8 Liftosaur and other open-source lifting apps
- **URLs:** Liftosaur `https://github.com/astashov/liftosaur` , `https://www.liftosaur.com/` ; flatgym `https://github.com/zerotonin/flatgym`
- **Covers:** Liftosaur is a weightlifting tracker for coders, with programs, progression scripts (Liftoscript), plate calculator, rest timer. Data files include programs and exercise definitions. Not tribal prose but program structure examples.
- **License:** **AGPL 3.0** (`https://github.com/astashov/liftosaur/blob/master/LICENSE`). flatgym is GPL-3.0. Both are copyleft network licenses.
- **Verdict: CODE AGPL, DATA REUSABLE WITH CARE.** You cannot copy Liftosaur source into a proprietary app without AGPL obligations (publish source if you offer network use). But you can read its program definitions and exercise logic to inform your own original knowledge base. The exercise names themselves are facts (not copyrightable). Do not bundle Liftosaur's source files verbatim in GymTune.
- **Source:** https://github.com/astashov/liftosaur/blob/master/LICENSE

### 1.9 Openly licensed strength training datasets on Hugging Face
- **URLs:** `https://huggingface.co/datasets` search "exercise", "fitness", "strength"
- **Findings:** No high-quality, openly licensed **text** tribal-knowledge dataset exists for strength training on HF as of 2026-08. What exists is:
  - **IMU/video datasets:** StrengthSense (IMU signals for 11 strength activities, 29 subjects, 10 IMUs) (https://arxiv.org/pdf/2511.02027), FormCoach (22 exercises, hosted on HF), Kaggle Workout/Exercises Video Dataset (22 exercises from YouTube), InfiniteRep (synthetic avatars, 100 videos/class). These are sensor/video classification datasets, not RAG text.
  - **No** curated MEV/MRV/RPE/deload markdown corpus under CC BY/CC0. Any HF dataset that is a scrape of Reddit/ExRx/SBS would inherit their non-permissive licenses.
- **Verdict:** Not usable for the knowledge vault. Build your own markdown corpus or derive from Wikipedia/wger/Free Exercise DB + original writing.
- **Sources:** https://arxiv.org/pdf/2511.02027 (StrengthSense), https://arxiv.org/pdf/2508.07501 (FormCoach), https://arxiv.org/pdf/2411.11548 (Kaggle+InfiniteRep context)

### 1.10 What to write yourself vs paraphrase-and-cite
- **Write yourself (original, no source needed):** All MEV/MAV/MRV tables (use RP concepts but assign your own numbers with ranges and explain they are starting points, not prescriptions), RPE/RIR scales with your own examples, deload decision trees, plateau diagnosis checklists (sleep, volume, technique, fatigue), per-exercise form cues in your own words, equipment substitution matrices (e.g., barbell bench -> dumbbell bench -> push-up -> band press), 4-day/3-day program templates.
- **Paraphrase-and-cite (read, synthesize, attribute, link):** Summaries of SBS articles (cite `strongerbyscience.com` URL), RP volume concepts (cite `rpstrength.com`), ExRx anatomy checks (link, not bundle), Reddit wiki program structures (cite wiki URL, but rewrite the prose). Keep paraphrase > edit-distance: change structure, add your own examples, do not replicate sentence order.
- **Ship with attribution:** Wikipedia CC BY-SA passages, wger CC BY-SA exercise definitions (add attribution screen), Free Exercise DB JSON (cite repo), Wikidata facts (no attribution needed).

---

## 2. Chunking for This Content Shape

### 2.1 Content shape
Markdown with headings (`#` title, `##` section, `###` sub-section), bullet tables for MEV/MRV, code blocks for program templates, short 2-4 sentence form cues. Corpus <1000 chunks, 256-token target, so average doc is ~1-2 chunks per file. Headers carry most of the disambiguation (e.g., "Deload > When to deload vs when to push" vs generic "reduce volume").

### 2.2 Header-aware splitting (LangChain MarkdownHeaderTextSplitter, LlamaIndex MarkdownNodeParser)
- **LangChain `MarkdownHeaderTextSplitter`:** Splits on `headers_to_split_on=[("#","Header 1"), ("##","Header 2"), ...]`, retains header hierarchy in `metadata` (`{Header 2: "Volume Landmarks"}`), does not derive from `TextSplitter`, strips whitespace. Common pattern: first split by headers, then `RecursiveCharacterTextSplitter` inside each section for size control. (https://docs.langchain.com/oss/python/integrations/splitters/markdown_header_metadata_splitter , https://reference.langchain.com/python/langchain-text-splitters/markdown/MarkdownHeaderTextSplitter)
- **LlamaIndex `MarkdownNodeParser`:** Splits on markdown headers, preserves full header path in metadata (`Header_1`, `Header_2`, `Header_3`), produces a hierarchical node graph (parent-child) for auto-merging retrievers, handles code blocks via tree-sitter. (https://docs.llamaindex.ai/en/stable/api_reference/node_parsers/markdown/ , https://run-llama-llamaindexts.mintlify.app/data/node-parsers)
- **Evidence for this shape:** "Markdown + header-aware chunking gives a 22-point improvement on top-1 retrieval over the naive baseline" (https://mdisbetter.com/blog/pdf-to-markdown-for-rag-pipeline-complete-guide). Headers provide natural semantic boundaries aligned with author intent, not arbitrary token counts.
- **For GymTune:** Use header-aware as first pass. It keeps "Bench Press > Plateau > Variation" separate from "Squat > Plateau > Variation", which fixed splitting would conflate. Then enforce 256-token cap per chunk.

### 2.3 Fixed-token recursive splitting (`RecursiveCharacterTextSplitter`)
- **How:** Recursively splits by `["\n\n", "\n", " ", ""]`, trying to keep paragraphs then sentences then words together, respecting `chunk_size` and `chunk_overlap`. Default for generic text. (https://reference.langchain.com/python/langchain-text-splitters/character/RecursiveCharacterTextSplitter , https://dev.to/eteimz/understanding-langchains-recursivecharactertextsplitter-2846)
- **Evidence on size:** "Use chunks of 256-1,024 tokens, adjust overlap 10-20%" (https://www.newline.co/@zaoyang/fixed-size-chunking-in-rag-pipelines-a-guide--af509f11). Factoid queries (specific facts like MEV values) prefer 256-512 tokens; analytical queries need 1024+ (https://stackviv.ai/blog/chunking-strategies-rag). For technical docs, 400-500 tokens captures a full API method; for RAG generally, ~250 tokens (~1000 chars) is a sensible start (https://unstructured.io/blog/chunking-for-rag-best-practices , https://milvus.io/ai-quick-reference/what-is-the-optimal-chunk-size-for-rag-applications). A 6-dataset study found "the optimal chunk size differs for each dataset"; SQuAD fact-checking peaked at 64 tokens (https://note.com/shimmyo_lab/n/n879709832dc3?hl=en).
- **Overlap:** Start 10-20% (50-100 tokens for 500-token chunks) to avoid splitting a sentence across chunks (https://www.firecrawl.dev/blog/best-chunking-strategies-rag); recent pipelines use 5-10% sliding window, 5% sufficient unless repetitive sections (https://arxiv.org/pdf/2604.07590). Jan 2026 systematic analysis with SPLADE+Mistral-8B found overlap provided no measurable benefit, only indexing cost (https://www.firecrawl.dev/blog/best-chunking-strategies-rag) — for <1000 chunks, cost is negligible, so include 20-30 tokens of overlap.
- **For GymTune:** Recursive splitter alone is the fastest baseline but "splits sentences mid-thought and degrades retrieval precision" and Vectara 2024 found it often performed as well as semantic chunking on realistic corpora (https://atlan.com/know/chunking-strategies-rag/ , https://www.rohan-paul.com/p/what-is-chunking-and-why-do-we-chunk). Use it only as second pass inside header sections.

### 2.4 Semantic / late chunking
- **Semantic chunking:** Detects meaning boundaries via embedding similarity between sentences, aims to maximize coherence within chunks. Improves recall across benchmarks but "benefits were inconsistent ... largely vanished on normal text" except stitched disparate topics; carries higher compute/latency cost. (https://www.rohan-paul.com/p/what-is-chunking-and-why-do-we-chunk , https://atlan.com/know/chunking-strategies-rag/)
- **Late chunking (Jina):** Reverses pipeline: encode entire document into token-level embeddings first, then partition into chunks. Preserves anaphoric references ("Its 3.85M inhabitants" stays linked to Berlin). Improves retrieval 10-12% on documents with pronouns, and "retrieval improved across all boundary strategies when paired with late chunking" (https://arxiv.org/pdf/2409.04701 , https://medium.com/@visrow/chunking-strategies-for-rag-early-late-and-contextual-chunking-explained-with-code-71b88e4709f9 , https://medium.com/kx-systems/late-chunking-vs-contextual-retrieval-the-math-behind-rags-context-problem-d5a26b9bbd38).
- **For GymTune:** Late chunking requires a long-context embedder (Jina v2 8192 tokens or Nomic 8192). Your corpus is short, hand-written, pronoun-light markdown where headers already solve reference. Late chunking would force you onto Jina/Nomic only and add complexity for ~no gain. **Skip for v1.** Revisit if you later ingest long RP/SBS articles via late chunking.

### 2.5 Should you prepend the heading path to each chunk?
**Yes, always.** For `all-MiniLM-L6-v2`/`bge-small`/`gte-small` at 256 tokens, the heading path is 5-15 tokens that dramatically disambiguates. Example: chunk text `"Reduce volume by 40%"` is useless alone; `"# Deload Protocol > When to deload > Reduce volume by 40% for one week ..."` retrieves correctly. Both LangChain and LlamaIndex retain headers in metadata; you must inline them into `page_content` before embedding (e.g., `"Program Design > Volume Landmarks > MEV for chest is 8-10 sets/week. ..."`). Evidence: Anthropic contextual retrieval is the extreme form of this and cuts failures 49%; heading prefix is the cheap, deterministic 80% solution.

### 2.6 Contextual retrieval (Anthropic, Sep 2024)
- **Technique:** "Prepending chunk-specific explanatory context to each chunk before embedding (Contextual Embeddings) and creating the BM25 index (Contextual BM25)." Generate 50-100 tokens per chunk with an LLM that sees the full document: `"This chunk is from ... discussing ..."` (https://www.anthropic.com/engineering/contextual-retrieval , https://docs.together.ai/docs/how-to-implement-contextual-rag-from-anthropic)
- **Performance:** Cut retrieval failures 49% alone, 67% when combined with reranking (Anthropic Sep 2024). AWS/community replications report 5-15% precision gains (https://arxiv.org/pdf/2601.05265).
- **Cost for GymTune:** One-time offline cost: ~1000 chunks * ~1K tokens input (full doc per chunk with prompt caching) * ~80 tokens output. With a small 1-3B quantized model (Llama 3.2 3B) and prompt caching, <$2 via Together AI, or free locally with Gemma 3 1B (ironic). Since you chunk offline with a Python script, this cost is paid once.
- **Verdict:** **Do it.** For a corpus where "plateau" appears in 6 sections, the context sentence ("This chunk explains plateau breaking for bench press when stuck 2-3 weeks despite adequate volume") is the difference between retrieving the right variation vs a generic deload chunk. Implement as `context + "\n\n" + heading_path + "\n" + chunk_text` before embedding. Store `context` separately if you want to ablate.

### 2.7 Recommended chunking for GymTune

```python
# offline: build_knowledge.py
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter
headers = [("#","h1"), ("##","h2"), ("###","h3")]
md_splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers, strip_headers=False)
recur = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=120, separators=["\n\n","\n"," ", ""]) # ~256 tokens
for doc in markdown_docs:
    sections = md_splitter.split_text(doc)
    for sec in sections:
        heading_path = " > ".join(v for k,v in sec.metadata.items() if v)
        sub_chunks = recur.split_text(sec.page_content)
        for chunk in sub_chunks:
            context = llm_contextualize(chunk, doc)  # 50-100 tokens, Anthropic prompt
            embed_text = f"{context}\n\n{heading_path}\n{chunk}" if heading_path else f"{context}\n\n{chunk}"
            # embed with search_document: prefix if nomic
```

Chunk size 256 tokens, overlap 20-30 tokens (10%). Persist `heading_path` + `context` + `source_url` + `license` in `knowledge.json` metadata.

---

## 3. Embedding Model

### 3.1 Comparison table (verified 2026-08)

| Model | HF ID | Params | Dims | Max tokens | Quant ONNX size | MTEB retrieval / overall* | License | Notes |
|---|---|---|---|---|---|---|---|

| **all-MiniLM-L6-v2** | `sentence-transformers/all-MiniLM-L6-v2` | 22.7M | 384 | 256 (ST truncates at 256; tokenizer allows 512 but degraded) | 80 MB FP32, ~23 MB quantized (Xenova) | **56.3** overall (https://www.premai.io/blog/best-embedding-models-for-rag-2026-ranked-by-mteb-score-cost-and-self-hosting/) | Apache 2.0 | 384 dims, runs <10ms CPU; truncate >256 |
| **bge-small-en-v1.5** | `BAAI/bge-small-en-v1.5` | 33.4M | 384 | 512 | ~133 MB FP32, ~40-60 MB int8 | Competitive, ~62 overall (retrieval strong) (https://huggingface.co/BAAI/bge-small-en-v1.5) | MIT | No prefix needed; v1.5 fixed similarity distribution |
| **gte-small** | `thenlper/gte-small` (also `Supabase/gte-small`) | 33.4M | 384 | 512 | ~130 MB | Strong on retrieval/STS/reranking (https://www.aimodels.fyi/models/huggingFace/gte-small-thenlper) | Apache 2.0 | Alibaba DAMO, BERT-based |
| **nomic-embed-text-v1.5** | `nomic-ai/nomic-embed-text-v1.5` | 137M (0.137B) | 768 (Matryoshka 64/128/256/512/768) | **8192** (RoPE, Dynamic NTK) | ~270 MB FP32, ~110 MB Q8_0 GGUF, ONNX ~130 MB | **62.39** overall (https://innovativeais.com/blog/best-embedding-models-for-rag-in-2026) | Apache 2.0 | Requires `search_document:` / `search_query:` prefixes |
| **snowflake-arctic-embed-s** | `Snowflake/snowflake-arctic-embed-s` | 33M | 384 | 512 | ~130 MB | SOTA at 33M, BEIR/MTEB retrieval top for small (https://dataloop.ai/library/model/snowflake_snowflake-arctic-embed-s/ , https://github.com/Snowflake-Labs/arctic-embed) | Apache 2.0 | Recommended small upgrade over MiniLM |
| **jina-embeddings-v3** (for reference) | `jinaai/jina-embeddings-v3` | 570M | 1024 (MRL to 32) | 8192 | >1GB | 65.52 overall, 65.5 MTEB (https://jina.ai/models/jina-embeddings-v3/) | CC BY-NC 4.0 / commercial | Too large for phone; skip |

*MTEB v1 vs v2 not comparable; retrieval split cited where available. Numbers from 2025-2026 leaderboards; check `https://huggingface.co/spaces/mteb/leaderboard` for live.

### 3.2 Critical details
- **MiniLM 256-token cap:** Model card says truncates at 256 tokens; tokenizer `model_max_length` was changed to 512 in a PR but card still says 256. SentenceTransformers truncates to 256; `transformers` direct allows 512 but degraded beyond 256 training config. For RAG at 256 target, this is a feature, not a bug. (https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/discussions/1 , https://github.com/huggingface/transformers/issues/15179)
- **Nomic prefix requirement:** Must prepend `search_document:` to every chunk at index time and `search_query:` to the user query at retrieval time (also supports `classification:`/`clustering:`). Without prefix, retrieval drops ~10 points. Nomic API uses `task_type` param instead. (https://docs.nomic.ai/atlas/embeddings-and-retrieval/text-embedding , https://github.com/Mintplex-Labs/anything-llm/issues/3198 , https://arxiv.org/pdf/2402.01613)
- **Newer credible small models:** `snowflake-arctic-embed-s` (33M, 384 dims, SOTA retrieval at small size) and `snowflake-arctic-embed-xs` (22M, 384) are credible 2024-2025 upgrades. `bge-small` remains lightest MIT option. Check MTEB v2 June 2026 leader: `Qwen3-Embedding-8B` tops at ~75 overall, but irrelevant for on-device.

### 3.3 On-device inference: the highest-risk unknown

**The query must be embedded on device** (user asks "stuck at 185 bench for 3 weeks" with no server). Five routes were evaluated:

**Route A: llama.cpp / llama.rn embedding mode with GGUF embedding model (BEST FOR YOUR STACK IF YOU ACCEPT RAM COST)**
- llama.cpp supports embedding mode natively: `./embedding -m nomic-embed-text-v1.5.f16.gguf -c 8192 --rope-scaling yarn` or `llama-server --embeddings` (https://huggingface.co/nomic-ai/nomic-embed-text-v1.5-GGUF , https://github.com/ggml-org/llama.cpp/discussions/4117). Nomic provides official GGUFs: `nomic-embed-text-v1.5-GGUF` (F16, Q8_0), `nomic-embed-text-v2-moe-GGUF`, `nomic-embed-code-GGUF`.
- **llama.rn:** Context must be created with `embedding: true`: `await initLlama({model: modelPath, n_ctx: 2048, embedding: true})`. Supports `n_parallel` for batch, iOS Extended Virtual Addressing, Android arm64-v8a/x86_64 only. Shipped and documented. (https://github.com/mybigday/llama.rn , https://www.react-native-ai.dev/docs/llama/model-management)
- **Pros:** Reuses same `llama.cpp` engine you already ship for Gemma 3 1B Q4_K_M (~720MB). Nomic 8192 token window useful if you later long-chunk.
- **Cons:** Nomic 137M + Gemma 1B = ~850MB RAM + two contexts. On 6GB RAM phones, two `LlamaContext` instances may OOM. You can serialize contexts (unload embed model after query) but latency spikes. 768-dim vectors double storage.
- **Evidence shipped:** Nomic GGUF + llama.cpp is production-tested (Cebtenzzre GGUFs, llama.cpp README). `llama.rn` embedding is documented but fewer public apps run dual contexts on 6GB devices — treat as **verified but high-risk for 6GB**.

**Route B: ONNX Runtime React Native + transformers.js / react-native-transformers (MOST PROVEN FOR EMBEDDINGS IN RN)**
- `onnxruntime-react-native` 1.24.3 (https://www.npmjs.com/package/onnxruntime-react-native) is Microsoft's mobile ONNX Runtime. Usage: `import { InferenceSession } from "onnxruntime-react-native"; const session = await InferenceSession.create(modelPath); await session.run(input)`. Supports ONNX+ORT format, not `uint8` except Android, no `ArrayBuffer` load.
- `transformers.js` (Xenova) v4 released 2026-02 via npm, now uses `com.microsoft.MultiHeadAttention` for ~4x BERT speedup. Popular models: `Xenova/all-MiniLM-L6-v2` (384d), `Xenova/bge-small-en-v1.5` (384d), `nomic-ai/nomic-embed-text-v1.5` (768d). Runs in browser, Node, Deno, React Native, CF Workers. (https://huggingface.co/blog/transformersjs-v4 , https://www.pkgpulse.com/guides/transformersjs-vs-onnx-runtime-web-2026)
- **React Native wrappers:**
  - `daviddaytw/react-native-transformers` (deprecated 2025-07) demonstrated `Xenova/all-MiniLM-L6-v2-onnx` ~80MB text embedding on device via ONNX Runtime, privacy on-device. (https://github.com/daviddaytw/react-native-transformers)
  - **Successor:** `@automatalabs/react-native-transformers` (2026-04-23) adds Expo config plugin, Metro alias for `@huggingface/transformers` -> RN wrapper, routes `onnxruntime-node/web` -> RN adapter. (https://www.npmjs.com/package/@automatalabs/react-native-transformers)
  - `nsense/all-MiniLM-L6-v2-onnx`, `onnx-community/all-MiniLM-L6-v2-ONNX`, `Supabase/gte-small` ONNX all available.
- **Caveat:** "Pure JavaScript ONNX inference is generally not recommended for production mobile apps due to performance and memory constraints" (https://simplico.net/2026/01/21/how-to-use-an-onnx-model-in-react-native-and-other-mobile-app-frameworks/). Peak typed-array buffers 150-300 MB on M2/Chrome for sentence model; quantized `all-MiniLM-L6-v2` ~23 MB weight, but runtime ~100 MB. ONNX issue #5883 reports slightly different embeddings RN vs Node due to ORT numerics, but within tolerance.
- **Evidence shipped:** Several RN/Expo apps run `Xenova/all-MiniLM-L6-v2-onnx` via `onnxruntime-react-native` (`expo-kokoro-onnx`, `react-native-transformers` example). This is the **most copied path** for on-device query embedding.

**Route C: react-native-executorch `useTextEmbeddings` (RECOMMENDED PRIMARY, MOST RECENT & SHIPPED)**
- `react-native-executorch` (Software Mansion, https://github.com/software-mansion/react-native-executorch) now supports embeddings natively (Issue #75 resolved). Hook: `import { models, useTextEmbeddings } from 'react-native-executorch'; const model = useTextEmbeddings({model: models.text_embedding.all_minilm_l6_v2()})` (https://docs.swmansion.com/react-native-executorch/docs/hooks/natural-language-processing/useTextEmbeddings). Releases note "Multilingual text embeddings - It is now possible to generate embeddings across different languages" (https://github.com/software-mansion/react-native-executorch/releases).
- **Powered by ExecuTorch** (PyTorch export to `.pte` format), not ONNX. Supports LLMs, YOLO, MobileNet, SAM etc. Models need export to `.pte` if you bring custom weights (but `all_minilm_l6_v2` is pre-exported).
- **RAG wrapper:** `software-mansion-labs/react-native-rag` provides `VectorStore` + `Embeddings` interfaces built on `react-native-executorch` + `op-sqlite`/`react-native-nitro-sqlite`. `Private Mind` app ships this. Packages: `npm install @react-native-rag/executorch react-native-executorch` and `npm install @react-native-rag/op-sqlite` (https://github.com/software-mansion-labs/react-native-rag , https://blog.swmansion.com/introducing-react-native-rag-fbb62efa4991)
- **Evidence shipped:** This is the **only route with a production RAG library + app** specifically for local offline RAG in React Native. Embeddings interface is officially `react-native-rag` backed by executorch. Latency: BGE-small query encoder ~170ms CPU on small/medium corpora (https://arxiv.org/pdf/2605.25092) — acceptable for one query per turn.
- **Cons:** Requires Expo prebuild/dev client (native module), model export to `.pte` if you bring custom weights (but `all_minilm_l6_v2` is pre-exported).

**Weighting:** Route C is highest confidence (ships today, maintained by Software Mansion, hooks, RAG lib). Route B is second (many demos, but original lib deprecated, community fork active). Route A is valid but competes for RAM with Gemma 3 1B and doubles vector dims; use only if you standardize on nomic for 8192 context + late chunking later. Avoid `transformers.js` pure JS without ORT — too slow.

**Recommended pick:** **Route C** (`react-native-executorch` `all_minilm_l6_v2` 384-dim) with `snowflake-arctic-embed-s` or `bge-small-en-v1.5` ONNX if you want MIT/Apache 384-dim at 512 tokens. If you prefer nomic quality, use Route A with `nomic-embed-text-v1.5.Q8_0.gguf` + `search_query:`/`search_document:` prefixes and accept 768-dim storage.

---

## 4. On-Device Storage and Retrieval

### 4.1 Arithmetic for <1000 chunks
- **Per vector raw:** `dims * bytesPerElement`
  - 384 dims float32: `384*4=1536` bytes
  - 384 dims int8: `384*1=384` bytes
  - 768 dims float32: `768*4=3072` bytes
  - 768 dims int8: 768 bytes
  - Binary (1-bit) 768 dims: 96 bytes (but recall loss 5-10 points; skip)
- **Total raw for 1000 vectors:**
  - 384 float32: ~1.5 MB
  - 768 float32: ~3.0 MB
  - 384 int8: ~0.38 MB
  - 768 int8: ~0.77 MB
- **With text + metadata:** Each chunk ~256 tokens ~1000 chars ~1KB text + heading/context + url/license (~300 bytes) => ~1.3 KB *1000 = 1.3 MB. Total asset `knowledge.json` = vectors + text = ~2.8 MB (384 float32) or ~4.3 MB (768 float32). JSON encodes numbers as strings, so on-disk JSON is ~2-3x raw: expect **5-8 MB JSON** for 384 float32, **8-12 MB** for 768 float32. Still well under Expo asset limits. Gzip over the wire ~40% smaller.
- **Quantization tradeoff:** int8 reduces total to ~1.7 MB raw (384) with 1-2 NDCG loss for retrieval (fine for reranking stage, but for brute force, float32 is simpler). No need to quantize for <1000 chunks — 1.5 MB is nothing.

### 4.2 Brute-force cosine latency in JS on mid-range phone
- **Theory:** "Anything below a few millions can work well with exact kNN - brute-force" (https://bigdataboutique.com/blog/scaling-vector-search-performance-from-millions-to-billions-8d50a1). Brute force not scalable beyond a few 100K vectors, linear scan, but at 1000 vectors you are 3 orders below.
- **Native SIMD:** FP32 cosine median 26.5ns (NEON), int8 4.7ns per 768-dim comparison on native (https://arxiv.org/pdf/2601.15311). JS is 100-1000x slower (interpreted, no SIMD).
- **JS realistic:** Normalize vectors at ingest (L2), then cosine = dot product (halves cost). Use `Float32Array` and typed-array loops or `for` with `let dot=0`. Expect:
  - 384-dim dot product JS: ~0.5-1.5 us per comparison (V8/JSC) on flagship, ~2-5 us on mid-range.
  - 1000 comparisons = 0.5-5ms (best/flagship) to 5-15ms (mid-range) to <30ms (low-end). Well under 100ms budget.
  - 768-dim doubles to ~10-30ms mid-range, still okay.
- **Need typed-array or native path?** Typed array sufficient for <1000. No need for WASM SIMD or native module. For >10K, switch to `altor-vec` 54KB WASM HNSW sub-ms or native `sqlite-vec`.
- **Recommendation:** Bundle `knowledge.json` as `{chunks: [{id,text,heading,context,source,license}], vectors: [[...]]}` or `{vectors: Float32Array}` if you base64-encode. At app start, load, L2-normalize if not pre-normalized, and brute-force dot product. Keep vectors in `Float32Array(1000*384)` contiguous for cache locality. Sort top-k=5-8 to feed LLM context (Gemma 1B has limited context ~2048 tokens; 5 chunks *256 =1280 tokens + prompt = fits).

### 4.3 expo-sqlite vs sqlite-vec
- **expo-sqlite:** "has become the default library for SQLite in the Expo ecosystem" but "simplicity means you have to manage everything ... only exposes an API for executing SQL statements" and has **no vector search** (https://docs.expo.dev/versions/latest/sdk/sqlite/ , https://blog.swmansion.com/building-vector-search-and-personal-knowledge-graphs-on-mobile-with-libsql-and-react-native, https://dev.to/ramsayromero/how-to-make-expo-sqlite-reactive-with-react-query-26fo). Verified: no `sqlite-vec` built-in.
- **op-sqlite + sqlite-vec:** `OP-Engineering/op-sqlite` has "sqlite-vec plugin, reactive queries, JSONB" built-in (https://github.com/OP-Engineering/op-sqlite). `margelo/react-native-nitro-sqlite` + `react-native-nitro-sqlite-vec` also supports vector tables: `createVectorTable`, `knnSearch(db, 'embeddings', [0.1,0.2], 10)` (https://github.com/margelo/react-native-nitro-sqlite). `@react-native-rag/op-sqlite` provides `VectorStore` on `op-sqlite` with libSQL (which already includes vector search, so `sqliteVec` not needed) (https://github.com/software-mansion-labs/react-native-rag/tree/main/packages/op-sqlite).
- **Works under Expo today?** Yes, but **not in Expo Go**. Requires Expo prebuild / dev client (`npx expo prebuild`, native modules). `alexgarcia.xyz/sqlite-vec/android-ios.html` confirms `op-sqlite` works for `sqlite-vec` on Android/iOS. (https://alexgarcia.xyz/sqlite-vec/android-ios.html)
- **Recommendation for GymTune (<1000 chunks):** **Skip sqlite-vec.** Brute-force JSON is simpler, zero native deps, works in Expo Go, and latency already <15ms. Add `op-sqlite` + `sqlite-vec` only if corpus grows to >5000 chunks or you want persistence across app launches beyond bundled asset (but bundled JSON is persisted anyway). If you adopt `react-native-rag`, it will pull `op-sqlite` anyway — then use its `VectorStore`.

---

## 5. Retrieval Quality

### 5.1 Hybrid search (BM25 + dense) on small corpus: worth it?
- **General evidence:** Hybrid improves recall 15-30% over single method with minimal complexity (https://dev.to/vf-insights/dense-vs-sparse-retrieval-mastering-faiss-bm25-and-hybrid-search-4kb1). Dense and sparse fail orthogonally; hybrid catches what either misses (https://blog.gopenai.com/hybrid-search-in-rag-dense-sparse-bm25-splade-reciprocal-rank-fusion-and-when-to-use-which-fafe4fd6156e).
- **Small corpus nuance:** "Under 500 short documents with consistent vocabulary — dense-only handles it" (https://denser.ai/blog/hybrid-search-for-rag/). But "BM25 tends to be relatively more valuable for smaller corpora — IDF statistics are meaningful and distinctive" (https://blog.gopenai.com/hybrid-search-in-rag-dense-sparse-bm25-splade-reciprocal-rank-fusion-and-when-to-use-which-fafe4fd6156e). For gym tribal corpus, queries contain identifiers/codes: "MEV", "MRV", "RPE 8", "nSuns", "185 bench", which BM25 catches while dense may miss.
- **Latency:** "In the hybrid pipeline the BGE-small query encoder (~170ms CPU) dominates total latency on small/medium corpora; C++ BM25 (0.04-0.35ms) is off the critical path" (https://arxiv.org/pdf/2605.25092). BM25-only at 0.22ms/query is ~800x faster than hybrid, but hybrid latency is dominated by embedding, so adding BM25 is free.
- **Verdict for GymTune:** **Yes, worth it.** Start with hybrid (BM25 + dense) fused via Reciprocal Rank Fusion (RRF, k=60). For tribal queries like "stuck at 185 bench for 3 weeks" BM25 matches "185", "bench", "plateau" literals; dense matches "progressive overload stall". RRF needs no training. Evaluate dense-only vs hybrid on your 60-80 goldens; only simplify if hybrid does not move recall@5.

### 5.2 Cheapest JS BM25
- **okapibm25** (`https://www.npmjs.com/package/okapibm25`, `https://github.com/FurkanToprak/OkapiBM25`): 500K+ downloads/year, pure JS/TS, `new BM25(docs)` with `k1=1.2, b=0.75`, tiny, no dependencies. Best for bundled 1000 docs.
- **wink-bm25-text-search** (`https://www.npmjs.com/package/wink-bm25-text-search`, `https://github.com/winkjs/wink-bm25-text-search`): Full-text search, in-memory index, export/import JSON, supports field weights (negative weights pull down), integrates with `wink-nlp` stemming/lemmatization. Heavier but richer. Exports JSON index (~100KB).
- **fast-bm25** (`https://www.npmjs.com/package/fast-bm25`): High-performance TS with field boosting + parallel processing.
- **embedded-vector-db** (`https://github.com/pguso/embedded-vector-db`): Lightweight hybrid (vector + BM25) self-contained, if you want one lib for both.
- **Recommendation:** `okapibm25` for minimal (~5KB gz) or `wink-bm25-text-search` if you want stemmed "bench/benches" matching. Both index 1000 docs in <10ms at startup, query <1ms. Build index offline or on first launch from chunk text (including heading+context).

### 5.3 Reranking on device: feasible?
- **Cost model:** Cross-encoder requires full forward pass per query-candidate pair, latency scales linearly N (https://arxiv.org/pdf/2510.15620). Transformer scales quadratic with sequence length; >30-40M params recommends GPU (https://docs.vespa.ai/en/ranking/cross-encoders.html).
- **Quantization:** int8 loses 1-2 NDCG@10 on hard benchmarks; fp16 holds full accuracy (https://zeroentropy.dev/concepts/cross-encoder/). Accuracy loss hits ranking most at top positions because scalar scores flip.
- **Feasibility for GymTune:** Retrieving 1000 docs, reranking top-5 with a 33M cross-encoder (e.g., `cross-encoder/ms-marco-MiniLM-L-6-v2` 22M, 384 dims) quantized int8 is **technically feasible** (~5 * ~30ms =150ms on CPU) but **not worth it** for 1000 corpus. Hybrid+RRF already gives 15-30% recall; reranker adds maybe 2-5 NDCG for 150ms + 80MB model. For very latency-sensitive, cascade (cheap small for top-100, larger for top-10) better than aggressive quant (https://zeroentropy.dev/concepts/cross-encoder/). If you add reranking, rerank only top-5 from hybrid, keep it optional and measure on goldens.
- **Verdict:** Skip for v1. GymTune's LLM (Gemma 3 1B Q4_K_M) will do final synthesis; better to give it 5 good chunks than 3 perfectly reranked ones.

### 5.4 Query rewriting when user asks "stuck at 185 bench for 3 weeks"
- **Problem:** User query is symptom, not vocabulary: corpus has "plateau", "progressive overload", "MRV", "overreaching", "variation", not "stuck at 185". Dense alone may map "stuck" to injury, not programming.
- **Techniques:**
  - **Rule-based expansion (cheap, deterministic, no LLM):** Regex `stuck at (\d+) (bench|squat|deadlift) for (\d+)` -> expand to `"bench press plateau progression failure to add weight"`. Maintain synonym map: `MEV=minimum effective volume`, `RPE=rate of perceived exertion`, `AMRAP=as many reps as possible`, `stall=plateau`. Prepend expanded terms to query before embedding. Works offline, zero latency.
  - **HyDE (Hypothetical Document Embeddings):** LLM hallucinates a pseudo-document "A lifter stuck at 185 bench for 3 weeks likely has accumulated fatigue or insufficient volume ... deload ... variation ..." and embed that. Helps if hallucination lands near real corpus embedding region, but "fails on niche domains" where LLM has not memorized product-specific jargon (https://jatinbansal.com/ai-engineering/query-transformations/). For gym tribal, Gemma 3 1B likely knows "plateau" but not your exact MEV tables, so HyDE may drift. Always A/B vs baseline on eval set before enabling. Temperature 0 + cache `hash(query)` to pay once (https://jatinbansal.com/ai-engineering/query-transformations/).
  - **Multi-query rewriting:** Generate 3 rewrites ("bench press plateau 185", "why bench press not progressing", "how to break bench plateau") and retrieve each, merge via RRF (https://www.kunwar.page/chapter/063-query-rewriting-hyde-multi-query-query-decomposition).
  - **Step-back prompting / Query2Doc:** Generate pseudo-doc with few-shot prompts, merge with original query (https://medium.com/@florian_algo/advanced-rag-06-exploring-query-rewriting-23997297f2d1).
- **Verdict for GymTune:** Implement **rule-based expansion + multi-query (2-3 variants) via Gemma 3 1B on device** (no server). Cache expansions. Skip HyDE for v1 unless eval shows +5% recall, because on-device LLM rewrite costs 1-2s and may hallucinate.

### 5.5 How to evaluate retrieval at all (RAGAS or hand-built golden question set)
- **RAGAS:** Needs golden questions + curated answers + ground truth. Framework: `context_precision`, `context_recall`, `faithfulness`, `answer_relevancy`. Challenge: "you need, at a minimum, a golden set of questions and curated answers" (https://www.vectara.com/blog/evaluating-rag). Can synthetically generate questions from documents but "requires a lot of knowledge of the dataset" to do well.
- **Hand-built golden set:** Recommended for this corpus size. "Collaborate with stakeholders to develop a set of golden question inputs that accurately reflect main use cases" (https://cloud.google.com/blog/products/ai-machine-learning/optimizing-rag-retrieval). Must include diverse query types: simple factoid, analytical, multi-hop (https://cloud.google.com/blog/products/ai-machine-learning/optimizing-rag-retrieval).
- **How many?** No fixed number, but guidance: cover main use cases; RAGAS docs suggest evaluation datasets complete with questions+answers+ground truth. For <1000 chunks and 6 tribal topics, **60-80 questions** is sufficient for v1: 10 per topic (volume landmarks, RPE/autoregulation, deload, plateau, substitution, form, program structure) + 10 cross-topic ("should I deload or push through plateau at RPE 9?") + 10 adversarial ("stuck at 185", "no barbell, only dumbbells", "shoulder hurts on bench"). Measure `hit@5`, `recall@5`, `MRR`. Re-evaluate after swapping embedder/chunker. Synthetic generation via RAGAS can augment to 150 but manually verify.
- **Metrics to track:** Retrieval `hit@5` (is gold chunk in 5?), `recall@5`, then generation faithfulness (does answer cite correct chunk?). Use `RAGAS` or simple script: for each Q, assert expected `chunk_id` in retrieved top-k.

---

## 6. Prior Art: Open-Source Fitness RAG, Gym Knowledge Base, or On-Device RAG React Native

| Repo | URL | What it is | Reusable for GymTune? |
|---|---|---|---|
| **software-mansion-labs/react-native-rag** | https://github.com/software-mansion-labs/react-native-rag | Local offline RAG for RN. Hook `useRAG`, class `RAG`, VectorStore+Embeddings. Backed by `@react-native-rag/executorch` (on-device inference) + `@react-native-rag/op-sqlite` (vector persistence). Powers `Private Mind` app. (https://blog.swmansion.com/introducing-react-native-rag-fbb62efa4991) | **Yes, directly.** Clone its ingestion + VectorStore + hybrid retrieval pattern. Use its `op-sqlite` VectorStore if you outgrow JSON. |
| **alexeygrigorev/fitness-assistant** (LLM Zoomcamp) | https://github.com/alexeygrigorev/fitness-assistant | RAG for exercise selection/replacement/instructions, Flask API, `rag.py`, `ingest.py`, in-memory `minsearch` DB. Helps choose exercises by muscle/equipment and alternatives. | **Yes, for data shape + RAG logic reference.** Fork `ingest.py` header chunking + `minsearch` BM25/densedemo. Not on-device, but design transfers. |
| **software-mansion/react-native-executorch** | https://github.com/software-mansion/react-native-executorch | Declarative on-device AI via ExecuTorch, hooks for LLM (`useLLM`) + embeddings (`useTextEmbeddings` with `models.text_embedding.all_minilm_l6_v2()`), supports `.pte` export, multilingual. (https://docs.swmansion.com/react-native-executorch/docs/hooks/natural-language-processing/useTextEmbeddings) | **Yes, for query embedding.** Copy its embedding hook usage; this is your Route C. |
| **RAGFlow (infiniflow/ragflow)** | https://github.com/infiniflow/ragflow | Leading open-source RAG engine + Agents, PDF/Markdown ingestion, vector+BM25 hybrid, reranking, UI. | **Architecture reference only.** Overkill for <1000 chunks on phone, but its hybrid+rerank pipeline is instructive. |
| **zerotonin/flatgym** | https://github.com/zerotonin/flatgym | One-file offline-first gym logger (no server), markdown logs, GPL-3.0. Discusses wger CC BY-SA friction and AGPL. | **Useful for offline-first patterns + wger licensing notes.** Not RAG, but shows how to bundle exercise data offline. |
| **wger-project/wger + wger-project/flutter** | https://github.com/wger-project/wger , https://github.com/wger-project/flutter | Self-hosted FLOSS workout/nutrition tracker, AGPL 3+, REST API, Flutter mobile (AGPL + app-store exception). | **For exercise DB ingestion.** Adapt its exercise schema; do not copy AGPL code into proprietary app. |
| **yuhonas/free-exercise-db** | https://github.com/yuhonas/free-exercise-db | Already covered in sources. | **Primary exercise corpus.** |
| **RAG-Gym (RAG-Gym/RAG-Gym)** | https://github.com/RAG-Gym/RAG-Gym | Official repo for RAG-Gym (academic RAG training env, not gym). | **No.** Name collision; irrelevant. |

**Most reusable:** `react-native-rag` + `react-native-executorch` for the entire on-device loop; `fitness-assistant` for the fitness-specific RAG ingestion/replacement logic.

---

## Summary: What to Ship vs What to Avoid

| Ship | Do not ship (write/paraphrase instead) | Unverified / needs recheck |
|---|---|---|
| Wikipedia CC BY-SA 4.0 text + Wikidata CC0 | RP articles (vague CC, full copyright) | RP's "Creative Commons" version ambiguity — treat as all rights reserved until they name a version |
| wger CC BY-SA 3.0 exercises (with attribution + share alike dataset) | SBS articles/podcasts (all rights reserved) | yuhonas image provenance for ~800 images (repo says public domain but issues #2/#12 flag mixed sources) |
| Free Exercise DB Unlicense (public domain) | ExRx (explicit anti-scrape/AI-training) | Exact MTEB retrieval scores for bge-small/gte-small on MTEB v2 English — leaderboards move monthly, check live |
| Your original 200-400 pages paraphrasing tribal knowledge (cite sources) | Reddit wiki/threads (requires $12K+ contract, robots.txt blocks, RFR only auth path) | sqlite-vec Expo Go support — verified: no, requires prebuild, but Expo may add in future |

**Open question for the team:** Confirm share-alike strategy for wger CC BY-SA dataset in a portfolio app: will you publish your derived exercise JSON under CC BY-SA 4.0 in `LICENSES/wger-derived.md` + attribution screen, or stay Unlicense-only via Free Exercise DB to avoid share-alike? Decision changes whether wger is primary or fallback.

---

## Sources (Primary, by section)

- RP Terms: https://rpstrength.com/pages/terms-of-service
- SBS Disclaimer: https://www.strongerbyscience.com/disclaimer/
- Reddit User Agreement: https://oag.ca.gov/sites/default/files/Reddit%2C%20Inc.%20-%20AB%20587%20Terms%20of%20Service%20Report%20(H1%202024).pdf
- Reddit Data API Wiki / Developer Terms: https://support.reddithelp.com/hc/en-us/articles/16160319875092-Reddit-Data-API-Wiki , https://support.reddithelp.com/hc/en-us/articles/14945211791892-Developer-Platform-Accessing-Reddit-Data , https://support.reddithelp.com/hc/en-us/articles/42728983564564-Responsible-Builder-Policy
- Reddit public content policy: https://techcrunch.com/2024/05/09/reddit-locks-down-its-public-data-in-new-content-policy-says-use-now-requires-a-contract , https://www.axios.com/2024/05/09/reddit-public-data-content-policy-ai-privacy , https://www.xpoz.ai/blog/guides/reddit-api-pricing-tiers-and-alternatives/
- Reddit robots.txt: https://web.swipeinsight.app/posts/reddit-updates-robots-txt-to-block-ai-crawlers-7937 , https://techcrunch.com/2024/06/25/reddits-upcoming-changes-attempt-to-safeguard-the-platform-against-ai-crawlers , https://technologylaw.fkks.com/post/102lz1g/is-your-sites-robots-txt-giving-content-to-ai-models-for-free
- ExRx Legal: https://exrx.net/Notes/Legal , https://exrx.net/Notes/License
- Wikipedia CC BY-SA: https://creativecommons.org/2023/06/29/wikipedia-moves-to-cc-4-0-licenses/ , https://en.wikipedia.org/wiki/Wikipedia:Reusing_Wikipedia_content
- Wikidata CC0: https://www.wikidata.org/wiki/Wikidata:Licensing
- wger docs/code/license: https://wger.readthedocs.io/en/latest/ , https://github.com/wger-project/wger , https://github.com/wger-project/flutter , https://apify.com/parseforge/wger-exercise-database-scraper
- Free Exercise DB: https://github.com/yuhonas/free-exercise-db
- Liftosaur: https://github.com/astashov/liftosaur , https://github.com/astashov/liftosaur/blob/master/LICENSE
- StrengthSense/FormCoach/Kaggle datasets: https://arxiv.org/pdf/2511.02027 , https://arxiv.org/pdf/2508.07501 , https://arxiv.org/pdf/2411.11548
- Chunking: https://docs.langchain.com/oss/python/integrations/splitters/markdown_header_metadata_splitter , https://reference.langchain.com/python/langchain-text-splitters/markdown/MarkdownHeaderTextSplitter , https://docs.llamaindex.ai/en/stable/api_reference/node_parsers/markdown/ , https://reference.langchain.com/python/langchain-text-splitters/character/RecursiveCharacterTextSplitter , https://www.newline.co/@zaoyang/fixed-size-chunking-in-rag-pipelines-a-guide--af509f11 , https://stackviv.ai/blog/chunking-strategies-rag , https://arxiv.org/pdf/2409.04701 , https://www.anthropic.com/engineering/contextual-retrieval
- Embedding: https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2 , https://huggingface.co/BAAI/bge-small-en-v1.5 , https://huggingface.co/thenlper/gte-small , https://huggingface.co/nomic-ai/nomic-embed-text-v1.5 , https://huggingface.co/Snowflake/snowflake-arctic-embed-s , https://docs.nomic.ai/atlas/embeddings-and-retrieval/text-embedding , https://www.anthropic.com/engineering/contextual-retrieval
- On-device: https://github.com/mybigday/llama.rn , https://huggingface.co/nomic-ai/nomic-embed-text-v1.5-GGUF , https://www.npmjs.com/package/onnxruntime-react-native , https://huggingface.co/blog/transformersjs-v4 , https://github.com/daviddaytw/react-native-transformers , https://www.npmjs.com/package/@automatalabs/react-native-transformers , https://github.com/software-mansion/react-native-executorch , https://docs.swmansion.com/react-native-executorch/docs/hooks/natural-language-processing/useTextEmbeddings , https://github.com/software-mansion-labs/react-native-rag
- Storage: https://bigdataboutique.com/blog/scaling-vector-search-performance-from-millions-to-billions-8d50a1 , https://arxiv.org/pdf/2601.15311 , https://docs.expo.dev/versions/latest/sdk/sqlite/ , https://github.com/OP-Engineering/op-sqlite , https://github.com/margelo/react-native-nitro-sqlite , https://alexgarcia.xyz/sqlite-vec/android-ios.html
- Retrieval: https://dev.to/vf-insights/dense-vs-sparse-retrieval-mastering-faiss-bm25-and-hybrid-search-4kb1 , https://blog.gopenai.com/hybrid-search-in-rag-dense-sparse-bm25-splade-reciprocal-rank-fusion-and-when-to-use-which-fafe4fd6156e , https://www.npmjs.com/package/okapibm25 , https://github.com/winkjs/wink-bm25-text-search , https://arxiv.org/pdf/2510.15620 , https://zeroentropy.dev/concepts/cross-encoder/
- Evaluation: https://www.vectara.com/blog/evaluating-rag , https://cloud.google.com/blog/products/ai-machine-learning/optimizing-rag-retrieval
- Prior art: https://github.com/software-mansion-labs/react-native-rag , https://github.com/alexeygrigorev/fitness-assistant , https://github.com/infiniflow/ragflow

