# Finetune for Markdown Chart Generation on Gemma 3 1B + llama.rn: Format, Grammar, and Minimum Viable Pipeline

**Date:** 2026-08-09  
**Scope:** GymTune local-first React Native + Expo gym tracker. Base: Gemma 3 1B Q4_K_M GGUF via llama.rn. Goal: reliable parseable chart block from RAG + workout history for react-native-chart-kit.

---

## VERDICT

**Skip the finetune. Ship grammar-constrained JSON plus few-shot prompting first.**

For GymTune on a 6-week solo timeline already committed to RAG, constrained decoding gives you 100% syntax compliance for free, while a finetune burns 1-2 weeks of dataset and export risk for gains that are mostly taste, brevity, and deciding *when* to show a chart. Revisit finetuning only after you have real user prompts and can measure the residual error that the grammar cannot fix.

Evidence in one line:

- llama.rn 0.12.8 exposes both `grammar` (raw GBNF) and `json_schema` (auto-converted to GBNF) and `response_format: {type: "json_schema", json_schema:{schema}}` on every `context.completion()` call, so you get 100% parsability without training.
- Small-model format-adherence without a grammar is poor and scales with complexity: 2-3% failure on flat schemas rising to 68-69% when `$defs`/`$ref` appear, with 1B models dominated by schema echo and empty-field failures, so any hand-rolled fenced block will need babysitting.
- A narrow format+tone task needs 500-2000 clean examples to beat few-shot, the Gemma 3 + Unsloth path has a known silent control-token bug in GGUF export, and the LoRA-to-GGUF export has two distinct steps that are easy to get wrong. None of those costs pay off until the grammar is already in place and you can isolate what is left.

Minimum viable version if you do finetune (after grammar ships): 300-800 synthetic examples across 2-3 epochs, Unsloth QLoRA r=16-32 on all linear layers on a free Colab T4, merge and requantize to a new Q4_K_M GGUF, and evaluate with a fixed compliance harness. Detail in section 3 and 4.

---

## 1. FORMAT CHOICE: What 1B Models Actually Emit Reliably

### 1.1 The short answer

**Raw fenced JSON with a tight schema < markdown table < custom tagged block << grammar-constrained JSON.** Mermaid xychart is the least reliable of the four for a 1B model and for react-native-chart-kit integration.

### 1.2 Evidence on small-model format failure

**JSONSchemaBench (10k real schemas, Llama-3.2-1B-Instruct as the efficiency probe):**

- Prompt was a simple instruction with two-shot examples, greedy (temperature 0) single run, validation with `jsonschema` Draft 2020-12.
- Evaluated six frameworks including Guidance, Outlines, and llama.cpp. Each computes constraints during token generation with minimal compilation time. Both Guidance and llama.cpp dynamically compute constraints. The six frameworks were benchmarked, Guidance leading on six of eight datasets, llama.cpp on the remaining two (including Washington Post and the JSON Schema Store). Overall conclusion: even with constrained decoding, the benchmark remains a significant challenge, with ample room for improvement.
- Sources: https://arxiv.org/html/2501.10868v3 , https://arxiv.org/pdf/2501.10868 , https://huggingface.co/datasets/epfl-dlab/JSONSchemaBench , https://arxiv.org/html/2604.25359v1

**VAREX (document extraction, models <4B):**

- Below 4B, extraction accuracy is dominated by structured-output compliance failures, not vision or reading errors.
- With `$defs`/`$ref` present, non-compliance jumps from 2-3% (flat schema) to 68-69% in affected models. Two failure modes: schema reproduction (model echoes the schema verbatim, dominant in InternVL3.5 1B) and schema-wrapped extraction, plus under-extraction (correct JSON but most fields empty: h2oVL 800M left 52% fields empty, 2B left 27% empty).
- NuExtract2.0 2B achieves zero schema echo and 90.8% exact match through extraction-specific finetuning, showing that compliance is learnable but not emergent at this scale.
- Sources: https://arxiv.org/pdf/2603.15118

**AscentCore small-LLM benchmark and general pattern:**

- Qwen 2.5 1.5B holds up for edge workloads but still shows the pattern: larger models have fewer format errors, smaller more prone, with compliance violations (not syntax) as the dominant mode.
- Llama-3.2-1B chosen specifically as the efficient probe that still produces high-quality outputs under constrained decoding.
- Source: https://ascentcore.com/2026/04/01/small-llm-performance-benchmark/

**What this implies for GymTune's four candidates:**

| Candidate | How 1B behaves without grammar | Why |
|---|---|---|
| Fenced JSON ```json {...}``` | Best of the unconstrained options, but highly sensitive to schema depth. Flat object with 3-5 keys and no `$ref` stays near 95-98% parsable in greedy mode; add optionals or nested arrays and adherence drops sharply. The fenced wrapper adds a second failure surface: model forgets to close fence or emits prose before/after the block. | Training data contains vast JSON; fencing is not native. |
| Markdown table `| a | b |` | Worse than JSON for machines. Content often correct but delimiter row `|---|---|` malformed, column count drifts mid-table, numeric alignment breaks. No schema to validate against beyond string match. | Tables are rendered prose, not a formal grammar in pretraining. |
| Custom tagged block `<chart>...</chart>` | Middling. Easier to extract via regex than JSON but same adherence problem; tag names mutate (`<charts>`, `<chart_data>`), nesting breaks, no off-the-shelf validator. | Tag is novel token sequence with zero pretraining prior. |
| Mermaid `xychart-beta` / `xyChart` | Worst. Mermaid syntax is brittle (quotes, axis labels, `x-axis`/`y-axis` keywords), hallucinates unsupported chart types, forgets ```mermaid fence, and react-native render will fail silently. Benchmark for sequence diagrams shows 0.5B-2B consistently behind 7B/8B on syntax correctness scores 0-1, with malformed syntax and missing activations as typical 1B errors. xychart itself is newer and less represented than sequence/flowchart, so failure will be higher. | Mermaid xychart is rare in pretraining; small model lacks capacity to memorize its grammar. Sources: https://arxiv.org/pdf/2511.14967 , https://www.researchgate.net/publication/397780175_MermaidSeqBench |

**Recommendation for GymTune given react-native-chart-kit:**

react-native-chart-kit has two APIs:

- Legacy (most Expo examples): `{ labels: string[], datasets: [{data: number[], color?, strokeWidth?}] }` . Source: https://github.com/indiespirit/react-native-chart-kit/blob/master/src/line-chart/LineChart.tsx and README at https://github.com/chart-kit/react-native-chart-kit/blob/main/README.md
- v2: array-of-objects with `xKey`/`yKey` props.

Emit the legacy shape as **grammar-constrained JSON** and map it directly to the chart. Do not emit markdown that the app then has to re-parse. Use a fenced JSON block only as a fallback rendering for debug, with the same payload inside.

Proposed schema (minimal, flat, no `$ref`):

```json
{
  "type": "object",
  "required": ["title", "labels", "datasets"],
  "properties": {
    "title": {"type": "string", "maxLength": 60},
    "labels": {"type": "array", "items": {"type": "string"}, "minItems": 2, "maxItems": 12},
    "datasets": {
      "type": "array", "minItems": 1, "maxItems": 2,
      "items": {
        "type": "object",
        "required": ["label", "data"],
        "properties": {
          "label": {"type": "string"},
          "data": {"type": "array", "items": {"type": "number"}, "minItems": 2, "maxItems": 12}
        },
        "additionalProperties": false
      }
    }
  },
  "additionalProperties": false
}
```

If you need mermaid for display elsewhere, generate it deterministically in JS from the same JSON; do not ask the model to write mermaid.

---

## 2. THE GRAMMAR ALTERNATIVE: What llama.rn Actually Exposes and What Finetuning Still Buys

### 2.1 What llama.cpp provides upstream

- **GBNF**: GGML BNF, a BNF variant with regex-like operators. You constrain sampling by zeroing logits for tokens that would break grammar rules before sampling. Performance overhead is slight for flat grammars; deep or repetitive grammars can slow sampling. Known gotchas: avoid `x? x? x?` with N repetitions; prefer `x{0,N}` or N-deep nesting. Source: https://github.com/ggml-org/llama.cpp/blob/master/grammars/README.md
- **JSON schema to GBNF**: `examples/json_schema_to_grammar.py` converts a subset of JSON Schema to GBNF. It defaults to `additionalProperties: false` because allowing extra properties is slow and prone to hallucination. Source: same README and https://github.com/ggml-org/llama.cpp/blob/master/examples/json_schema_to_grammar.py
- **Empty-string / early-EOS likelihood misalignment**: Grammar-constrained decoding can produce an empty-string top generation (just EOS) when the grammar and model likelihood are misaligned; the model prefers to end early rather than generate valid content under the grammar. See section 5 of https://arxiv.org/pdf/2305.13971 . Infinite-loop and stale-stack bugs have also been reported around grammar lazy triggers and `<unused>` tokens (e.g., https://github.com/ggml-org/llama.cpp/issues/19068 , https://github.com/ggml-org/llama.cpp/issues/23677 ).
- **Lora vs grammar interaction**: `convert_lora_to_gguf.py` flow is orthogonal to grammar. Grammar is applied at sampling time regardless of whether LoRA is merged or runtime-loaded.

### 2.2 What llama.rn exposes (mybigday/llama.rn, checked 2026-08-09)

Checked sources: README at https://raw.githubusercontent.com/mybigday/llama.rn/main/README.md (full text up to 872 lines), `src/types.ts` at https://raw.githubusercontent.com/mybigday/llama.rn/main/src/types.ts, and `src/index.ts` at https://raw.githubusercontent.com/mybigday/llama.rn/main/src/index.ts (1611 lines).

API surface:

- **Package**: `llama.rn` on npm, current latest 0.12.8 (published 4 days ago per npm). Requires React Native New Architecture from v0.10 onward; v0.9 branch for Old Architecture. Source: npm page https://www.npmjs.com/package/llama.rn
- **Completion signature**: `context.completion(params, onToken?)` where params aggregates:

  ```ts
  // src/types.ts, NativeCompletionParams (lines 1-300)
  export type NativeCompletionParams = {
    prompt: string
    jinja?: boolean
    json_schema?: string       // JSON schema string -> auto-converted to GBNF
    grammar?: string           // raw GBNF grammar, overrides json_schema
    grammar_lazy?: boolean
    grammar_triggers?: Array<{type:number, value:string, token:number}>
    chat_format?: number
    reasoning_format?: 'none'|'auto'|'deepseek'
    stop?: string[]
    n_predict?: number
    // ... sampling, speculative
  }
  ```

  Note: `json_schema` will be overridden by `grammar` if both are set.

- **High-level wrapper**: `src/index.ts` adds `CompletionResponseFormat`:

  ```ts
  export type CompletionResponseFormat = {
    type: 'text' | 'json_object' | 'json_schema'
    json_schema?: { strict?: boolean, schema: object }
    schema?: object // for json_object
  }
  export type CompletionBaseParams = {
    messages?: RNLlamaOAICompatibleMessage[]
    response_format?: CompletionResponseFormat
    // ...
  }
  ```

  So you can call either the ergonomic path:

  ```ts
  await context.completion({
    messages: [{role:'user', content: prompt}],
    response_format: { type:'json_schema', json_schema:{ schema: mySchema } },
    n_predict: 300,
  })
  ```

  or the low-level path:

  ```ts
  await context.completion({
    prompt: formattedPrompt,
    json_schema: JSON.stringify(mySchema),
    // or grammar: myGbntString,
  })
  ```

  Verified via type inspection of `NativeCompletionParams.json_schema` and `grammar` plus README statement: json_schema works in response_format during completion by converting to GBNF grammar, and the docs advertise Grammar Sampling: GBNF and JSON schema support for structured, constrained output generation (README badge/features section).

- **Version coverage**: `json_schema` / `grammar` fields are present in `NativeCompletionParams` in current `main`. A README search indicates json_schema-to-GBNF conversion is a built-in feature; this has been available since at least the 0.9 timeframe and is not version-gated to 0.12.x narrowly. The `CHANGELOG.md` at `https://raw.githubusercontent.com/mybigday/llama.rn/main/CHANGELOG.md` currently returns 404 from raw fetch (unverified if moved to GitHub Releases). Recommend pinning `llama.rn >= 0.11.0` to guarantee `json_schema` support and confirming via `context.completion` type autocomplete.

- **LoRA surface (for later section)**: `NativeContextParams` includes `lora?: string`, `lora_scaled?: number`, `lora_list?: Array<{path:string, scaled?:number}>`. JSI bindings expose `llamaApplyLoraAdapters`, `llamaRemoveLoraAdapters`, `llamaGetLoadedLoraAdapters`. Runtime swap is exposed but has known bugs in 0.11.x (partial-init leak, duplicate `lora`+`lora_list`, busy-check bypass in parallel mode, `getLoadedLoraAdapters` empty). Source: types.ts full read via artifact://3 and https://github.com/mybigday/llama.rn/issues/321 .

### 2.3 Straight verdict: does finetuning for FORMAT still buy anything if grammar gives 100% compliance?

**Grammar guarantees syntax, not semantics.** Treat them as complementary:

| Guarantee | Grammar alone | Few-shot + grammar | Finetune + grammar |
|---|---|---|---|
| Valid JSON parsable as `labels`/`datasets` | Yes, 100% by construction (if grammar is correct). | Yes | Yes |
| Schema-correct keys and types | Yes | Yes | Yes |
| Non-empty, plausible numbers (no hallucinating 5000 lb bench) | No. Grammar forces numbers but not the values. Model can emit syntactically valid nonsense under the mask. | Partial, depends on retrieved workout history in prompt. | Better, after seeing volume patterns. |
| When to emit a chart vs plain text vs no-chart | No. Using grammar forces a chart every time you apply it; deciding not to chart is a policy decision the model must make. | Prompt can say respond with {\"chart\":..., \"text\":...} or use `grammar_lazy` triggers, but 1B reliability on that decision is low. | Yes, the strongest finetune win: calibrates the chart vs no-chart decision. |
| Brevity and tone (GymTune voice, short coaching blurb) | No. | Few-shot helps but eats context. | Yes, with ~500 examples you can bake tone so prompts shrink. |
| Latency and prompt size | Adds modest sampling overhead; prompt smaller if you rely on grammar. | Larger prompt due to examples. | Smaller prompt, but need extra model download. |

Conclusion for GymTune: **the grammar already solves the FORMAT half**. Finetuning for FORMAT alone is redundant. Finetuning still buys: (a) content quality (numbers grounded in workout history, not invented), (b) brevity/tone without many-shot, and (c) the branching decision of when a chart helps versus when text is better. If your product always shows a chart on the Progress tab and plain text in Coach, even (c) is moot and the case for finetuning is very thin.

---

## 3. THE FINETUNE PIPELINE, CONCRETELY

### 3.1 Tooling: Unsloth vs Hugging Face TRL/PEFT vs Axolotl

**Recommendation for GymTune: Unsloth.**

- **Unsloth** is the only framework that works correctly on float16-only GPUs (T4, RTX 20xx, V100) for Gemma 3. It manually keeps activations in bfloat16/float32, does matmuls in float16 with manual up/down casting, and upcasts layernorms. Other stacks NaN. Unsloth makes 1B QLoRA fit comfortably on a free Colab T4 with `load_in_4bit=True`, is 1.6-1.7x faster and ~60% less VRAM than HF+FA2 on a 48GB run, and auto-selects dtype. Tested config: Alpaca dataset, batch 2, grad-acc 4, rank 32 on all linear layers (q,k,v,o,gate,up,down). Supports `full_finetuning` and `load_in_8bit` as preliminary flags. Sources: https://unsloth.ai/blog/gemma3 (Mar 14 2025), https://unsloth.ai/docs/models/gemma-4/train , https://www.codecademy.com/article/how-to-fine-tune-google-gemma-270m-with-unsloth-and-qlora
- **Hugging Face TRL + PEFT**: The reference stack (TRL's `SFTTrainer`, `DPOTrainer`, etc. + PEFT LoRA). More transparent, composable, slower than Unsloth. TRL v1.0 integrates PEFT, data packing, and Unsloth acceleration as an option. Use if you need full control or RLHF (GRPO/DPO/KTO) later. Requires you to handle the Gemma 3 float16 issue yourself (set `bf16=True` on A100/H100 or `fp32`). Sources: https://huggingface.co/docs/trl/index , https://marktechpost.com/2026/04/01/hugging-face-releases-trl-v1-0... , https://huggingface.co/docs/trl/en/peft_integration
- **Axolotl**: Config-driven, reproducible, strong for multi-GPU and production pipelines. Added custom Triton kernels for LoRA (Feb 2025, inspired by Unsloth), QAT, sequence parallelism via Ring FlashAttention, GRPO support. Overkill for a single T4 single-model job; prefers YAML config over code. If GymTune scales to multi-GPU or long-context training later, migrate here. Sources: https://dev.to/ultraduneai/eval-003-fine-tuning-in-2026-axolotl-vs-unsloth-vs-trl-vs-llama-factory-2ohg , https://www.spheron.network/blog/axolotl-vs-unsloth-vs-torchtune/ , https://www.hyperbolic.ai/blog/comparing-finetuning-frameworks , https://www.marktechpost.com/2026/07/22/unsloth-vs-axolotl-vs-trl-vs-llama-factory... , Axolotl v0.29.0 Feb 2026

**Decision tree:** Single consumer GPU, 1B, LoRA, want fastest wall clock and least VRAM -> Unsloth. Already have Axolotl YAML pipeline or need RLHF at scale -> Axolotl. Want maximum transparency or upstream bug-fix speed -> TRL+PEFT (and optionally plug Unsloth kernels).

#### Gemma-3-specific gotchas (must read before training)

1. **float16 infinity on T4/20xx/V100**: Gemma 3 1B-27B activations exceed float16 max 65504 (bfloat16 max is ~1e38). Mixed-precision float16 produces infinite gradients. Unsloth fixes this by defaulting to `float32` on affected hardware and using manual bfloat16/float32 casting. If you use TRL/PEFT on a T4 without Unsloth, you must set `fp16=False, bf16=False` or use `torch.float32` autocast, or you will get NaNs. Verify by watching loss for inf in first 10 steps. Sources: https://unsloth.ai/blog/gemma3 , https://github.com/unslothai/unsloth/issues/2776 , https://github.com/unslothai/unsloth/releases/tag/2025-03
2. **Tokenization and GGUF control-token bug**: Unsloth release 2025-03 fixed many infinite-gradient tokenization issues. Separately, Gemma 3 GGUF export via `save_pretrained_gguf` can write `<start_of_turn>` (id 105) and `<end_of_turn>` (id 106) as type NORMAL (1) instead of CONTROL (3) in the GGUF `tokenizer.ggml.token_type` array. llama.cpp only matches them as special when `parse_special=True` and type is CONTROL, so the model instead BPE-splits the literal `<start_of_turn>` string into subwords, silently breaking chat inference and producing garbage. Marked currently fixing in issue #5070; verify any exported GGUF with a hex dump or `llama-gguf-info` before shipping. Source: https://github.com/unslothai/unsloth/issues/5070
3. **Chat template now forces BOS**: Gemma 3 IT requires `<bos>` at the start of every prompt and uses `<start_of_turn>user...<end_of_turn><start_of_turn>model...<end_of_turn>`. Going off-template is out-of-distribution. Source: https://unsloth.ai/blog/gemma3 (Gemma 3 Analysis), https://ai.google.dev/gemma/docs/core/prompt-structure
4. **Vocab 262K, SentencePiece split digits / whitespace**: Ensure tokenizer version matches `google/gemma-3-1b-it` (use `AutoTokenizer.from_pretrained` for the same revision you train). Mismatched vocab will corrupt LoRA.

### 3.2 Hardware and cost

**VRAM for 1B QLoRA:**

- Base 1B weights in 4-bit: ~0.6-0.8 GB. LoRA rank 16-32 adds <100 MB. Activations dominate. Unsloth QLoRA on Gemma 3 1B fits in well under 10 GB with 4-bit + checkpointing. Public guidance: the 270M and 1B variants work comfortably on a free Colab T4 (16 GB) with `load_in_4bit=True`. Source: https://www.codecademy.com/article/how-to-fine-tune-google-gemma-270m-with-unsloth-and-qlora
- By contrast, Gemma 3 27B finetune fits under 22 GB with Unsloth dynamic 4-bit, so 1B is an easy case. Source: same Unsloth blog.

**Wall clock:**

- Codecademy walkthrough for Gemma 3 270M QLoRA reported complete workflow finished in under 20 minutes on T4. For 1B with few thousand examples, expect 20-60 minutes per run on Colab T4 (batch 2, grad-acc 4, 1-3 epochs). Multi-epoch on 1000-10000 examples on a 48GB GPU is typically 2-12 hours in the QLoRA literature (https://aicompetence.org/train-a-lightweight-llm-with-qlora/), but 1B is substantially faster.
- Colab free T4 is 16 GB, sometimes time-limited to ~12h and with variable availability. Kaggle also offers 2x T4 16GB free (16h/week as of 2024). Either suffices for this task.

**Cost if not free tier:**

- Modal/AWS/Rundpod spot for a T4 or L4 is ~0.30-0.60 per hour. At 1 hour per experiment times 10 experiments = $3-6. An A100 40GB is $1-2/hr but unnecessary for 1B QLoRA.
- Unsloth Pro (subscription) is required only for multi-GPU, not for single T4. Source: https://www.spheron.network/blog/axolotl-vs-unsloth-vs-torchtune/

### 3.3 Dataset: how many, what records look like, how to synthesize

#### How many examples actually needed (narrow format+tone task)

Do not guess; anchor to observed numbers:

- **50-100** is the absolute floor; below that you are just doing few-shot prompting disguised as finetuning. Source: https://particula.tech/blog/how-much-data-fine-tune-llm
- **200-500** suffices for classification/extraction with LoRA on Llama 3/Mistral/Qwen 2.5 for a well-scoped task, often reaching high 90s after one afternoon.
- **500-2000** is the band for content generation tasks where tone and brevity matter.
- **1000-5000** for complex domain tasks; empirical sweep on Swallow-8B QLoRA r=16 with n=1000/2000/3000/4000/5000 found optimum at 4000 with overfit at 5000. Source: https://arxiv.org/pdf/2603.18037
- **Quality beats quantity**: 200 curated > 2000 sloppy; mixing synthetic with real and deduplicating is more important than volume. Sources: same Particula article, https://www.digitalapplied.com/blog/synthetic-data-generation-llm-training-decision-guide-2026 , https://arxiv.org/pdf/2412.14689
- For GymTune's narrow chart JSON + tone task, **300-800** well-distributed examples is the right starting point. Expect single-epoch compliance jumps: a recent 2B model went from baseline to 100% label compliance and 96.7% commentary compliance after one epoch, reaching 100% at convergence (https://arxiv.org/pdf/2509.26278). If you measure format compliance after 300 and it is already >98%, stop adding data and work on semantic quality.

#### Record format: Gemma 3 chat template exactly

Gemma 3 IT is trained with:

```
<bos><start_of_turn>user
{system + retrieved knowledge + workout history + user question}<end_of_turn>
<start_of_turn>model
{assistant answer, optionally ending with chart JSON}<end_of_turn>
```

Special tokens:

- `<bos>` - beginning of sequence (id 2, required)
- `<start_of_turn>` (id 105) + role `user`/`model` + `\n`
- `<end_of_turn>` (id 106)
- `<end_of_turn>` for each turn, including final model turn during training.
- Do not add `<start_of_turn>user` inside the JSON payload. The JSON is the model's content within the model turn.

Concrete HF `datasets` record for SFTTrainer (Unsloth/TRL):

```json
{
  "messages": [
    {"role": "user", "content": "You are GymTune, a concise gym coach.\n\nKnowledge:\n- When stuck 2-3 weeks, deload 30-50% one week.\n- Bench press: keep elbows 45deg.\n\nWorkout history (last 6): Bench 185x5, 185x5, 185x5, 185x6, 190x4, 185x5.\n\nQuestion: I've been stuck at 185 bench for 3 weeks, what should I do?\n\nIf a chart helps, output JSON per schema after your 2-sentence advice."""},
    {"role": "assistant", "content": "You've plateaued, so take a light week at 130-150 lbs then wave back up. You added a rep last week, so the stall is short.\n\n```json\n{\"title\": \"Bench Press Volume (lbs x reps)\", \"labels\": [\"W1\",\"W2\",\"W3\",\"W4\",\"W5\",\"W6\"], \"datasets\": [{\"label\": \"Top set\", \"data\": [925, 925, 925, 1110, 760, 925]}]}\n```"}
  ]
}
```

Hugging Face `trl`/`unsloth` chat templating:

```python
from unsloth import FastLanguageModel
from transformers import AutoTokenizer
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/gemma-3-1b-it",  # or google/gemma-3-1b-it
    max_seq_length=2048,
    dtype=None,           # auto-selects bfloat16/float32 per GPU
    load_in_4bit=True,
)
# Apply Gemma's chat template automatically via tokenizer.apply_chat_template
# For SFTTrainer, set dataset_text_field="text" with already-templated text, or use packing.
```

Critical: Use `tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=False)` to render the full prompt+completion, then train on the whole sequence with labels masked on the user side (SFTTrainer does this when `train_on_responses_only=True` or via `DataCollatorForCompletionOnlyLM`). If you hand-craft strings, ensure `<bos>` is present and roles are exactly `user`/`model` (lowercase). Verified via https://ai.google.dev/gemma/docs/core/prompt-structure and https://unsloth.ai/blog/gemma3#fixes.

#### How to synthesize training data with a larger model while avoiding collapse

**Threats:** format-collapse (all JSON identical shape), mode-collapse (tone collapses to one canned phrasing, or model forgets general chat), and data leakage from synthetic data loops.

**Recommended pipeline:**

1. **Seed from real distribution**: Pull 100-200 real workout histories from the app's parser (or hand-write varied ones: different lifts, stall lengths, bodyweight vs barbell). Synthesize from those histories, not from a topic list. Seeding from real examples is the primary mitigation against collapse (https://www.digitalapplied.com/blog/synthetic-data-generation-llm-training-decision-guide-2026, https://arxiv.org/pdf/2412.14689).
2. **Diverse generation prompts for teacher**: Use a larger model (GPT-4o, Claude, Gemini) as teacher. Template should vary:
   - Lift: bench, squat, deadlift, OHP, row
   - Time horizon: 2 weeks, 6 weeks, 12 weeks
   - Equipment constraint: barbell-only, dumbbells, bodyweight
   - Goal: plateau, volume, PR display, deload timing
   - Tone instruction: Two example phrasings per type, rotating
   - With vs without chart (30% of examples should be no-chart to teach the branch)
3. **Generate with high temperature + filtering**: Teacher temp 0.8-1.0, top_p 0.95, then filter: (a) JSON must validate against schema, (b) `labels.length == datasets[0].data.length`, (c) data values within 20% of history-derived plausible range, (d) dedup by normalized JSON + Jaccard on advice text. Discard >50% if needed.
4. **Mix strategies to keep general ability**: Include 20-30% examples that are plain-text coaching answers with no chart, even for chartable questions. Scale history suggests standard SFT suppresses diversity 3-8% per finetune (see https://dev523.medium.com/fine-tuning-large-language-models-on-diverse-textual-data-b8d534465971), so keep non-JSON tasks in mix.
5. **Data accumulation, not replacement**: Do not iterate synthetic on synthetic. Always keep the original real seeds and regenerate from them. Accumulation prevents model collapse across generations (Gerstgrasser et al., 2024; https://cseweb.ucsd.edu/~yuxiangw/classes/AIsafety-2025Fall/Lectures/preventing_model_collapse_suraj.pdf).
6. **Quality filter categories before training**: Parsable JSON rate, schema compliance rate, exact-match rate after canonicalization, plus diversity metrics (distinct labels count, data variance). Reject synthetic if >90% share the same label strings.
7. **Volume target**: Generate 1200-1500 candidates to curate down to 600-800 kept. Curated 600 beats uncurated 2000.

Example teacher prompt:

```
You are generating finetune data for GymTune.
Write a user turn (2-3 sentences, natural) about a bench plateau with this history: {history}.
Then write a model turn: 1-2 sentence advice in a friendly coach tone, then optionally a JSON chart per this schema: {schema}.
If history shows upward trend, do NOT emit a chart.
Vary your phrasing. Output exactly one JSON record with {messages:[...]}.
```

### 3.4 Export path: LoRA adapter to GGUF

llama.cpp still supports LoRA, via two distinct workflows. Get them right.

#### Path A: Runtime adapter (no model merge, smallest download)

This is the change that matters for time and risk.

**Step 1: Train and save HF adapter**

```python
from unsloth import FastLanguageModel
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/gemma-3-1b-it",
    max_seq_length=2048, load_in_4bit=True, dtype=None,
)
model = FastLanguageModel.get_peft_model(model,
    r=32, lora_alpha=32,
    target_modules=["q_proj","k_proj","v_proj","o_proj","gate_proj","up_proj","down_proj"],
    lora_dropout=0, bias="none", use_gradient_checkpointing="unsloth",
)
# ... train with SFTTrainer ...
model.save_pretrained("lora_adapter")  # writes adapter_config.json + adapter_model.safetensors
tokenizer.save_pretrained("lora_adapter")
```

Recommended flags (Unsloth + TR L):

- `per_device_train_batch_size=2`, `gradient_accumulation_steps=4`, `learning_rate=2e-4`, `num_train_epochs=2-3`, `warmup_ratio=0.03`, `optim="adamw_8bit"`, `bf16`/`fp16` auto, `max_seq_length=2048`.

**Step 2: Convert adapter to GGUF**

llama.cpp's `convert_lora_to_gguf.py` is the required bridge (C++ loader only reads GGUF tensors, so mmap-compatible). Verified script at https://raw.githubusercontent.com/ggml-org/llama.cpp/master/convert_lora_to_gguf.py (546 lines). Arguments: `--outfile`, `--outtype {f32,f16,bf16,q8_0,auto}`.

```bash
# After cloning llama.cpp and creating env with torch + transformers
python convert_lora_to_gguf.py \
  --base google/gemma-3-1b-it \
  --outtype f16 \
  lora_adapter  # directory containing adapter_config.json
# Produces e.g. lora_adapter.gguf (or path set via --outfile)
```

Sources: script args docs at https://github.com/ggml-org/llama.cpp/blob/master/convert_lora_to_gguf.py and Instagit how-to at https://instagit.com/ggml-org/llama.cpp/how-to-use-lora-adapters-with-gguf-models/; also https://github.com/ggml-org/llama.cpp/discussions/5360.

**Step 3: Load at runtime in llama.rn**

Two equivalent routes, both verified in types.ts:

```ts
import { initLlama } from 'llama.rn'

// Route 1: at context creation
const ctx = await initLlama({
  model: modelPath,      // e.g. gemma-3-1b-it-Q4_K_M.gguf
  lora: adapterGgufPath, // single adapter
  lora_scaled: 1.0,
  // or lora_list: [{path: aPath, scaled: 1.0}, {path: bPath, scaled: 0.5}]
  n_ctx: 2048,
  n_gpu_layers: 99,
})

// Route 2: swap after init
await ctx.applyLoraAdapters([{path: adapterGgufPath, scaled: 1.0}])
console.log(await ctx.getLoadedLoraAdapters())
await ctx.removeLoraAdapters()
```

JSI bindings backing this: `llamaApplyLoraAdapters`, `llamaRemoveLoraAdapters`, `llamaGetLoadedLoraAdapters` (verified in src/index.ts jsiBindingKeys list). Fresh bugs reported against 0.11.5 behavior (https://github.com/mybigday/llama.rn/issues/321): partial-init leak, `lora`+`lora_list` duplicate, busy-check bypass in parallel mode, and `getLoadedLoraAdapters()` returning empty after a fix. If you hit those, restart context rather than hot-swapping.

Runtime loading keeps base download at ~720 MB plus ~20-50 MB adapter, memory-mapped without duplication per Instagit notes. Whether you hot-swap or create-time attach, measure RSS on a 6GB phone: some Android firmwares handle mmap of LoRA less efficiently.

#### Path B: Merge and requantize whole model (most reliable today)

Because runtime LoRA in llama.rn has open bugs, the safer production path is to bake LoRA into a new quantized GGUF:

Option B1: HF merge then GGUF (most portable):

```bash
# In Python after training with Unsloth/PEFT
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer
base = AutoModelForCausalLM.from_pretrained("google/gemma-3-1b-it", torch_dtype="auto")
peft = PeftModel.from_pretrained(base, "lora_adapter")
merged = peft.merge_and_unload()  # fuses LoRA into base weights
merged.save_pretrained("merged_fp16")
AutoTokenizer.from_pretrained("google/gemma-3-1b-it").save_pretrained("merged_fp16")

# Then use llama.cpp's convert_hf_to_gguf.py + quantize
python llama.cpp/convert_hf_to_gguf.py merged_fp16 --outfile gymtune-merged-f16.gguf
./llama-quantize gymtune-merged-f16.gguf gymtune-1b-Q4_K_M.gguf Q4_K_M
```

Option B2: GGUF-native merge if you already have base GGUF + adapter GGUF:

```bash
# Using llama.cpp tools: export-lora variant
./bin/llama-export-lora \
  -m gemma-3-1b-it-Q4_K_M.gguf \
  -o gymtune-1b-merged-Q4_K_M.gguf \
  --lora-scaled gymtune-adapter.gguf 1.0
# Or newer name per docs
./bin/llama-export-lora --model-base ... --model-out ... --lora-scaled ... 1.0
```

Reported commands vary by build (see https://rentry.co/llama-cpp-conversions and https://github.com/ggml-org/llama.cpp/discussions/8663). Wildcard path: because Gemma 3 export has the control-token risk, after any GGUF build, verify token types before bundling.

Unsloth also offers direct `save_pretrained_gguf` (quantized GGUF from finetune in one shot), but that is the codepath affected by the Gemma 3 control-token bug; if you use it, verify the output as described.

**Which to choose for GymTune:** Start with runtime adapter if you want to A/B the chart style without re-downloading 720 MB. Ship merged Q4_K_M for production to avoid the runtime bugs and to keep phone logic simple (one file path to manage). Download size difference on cellular matters more than the 30 MB adapter saving.

#### Exact commands checklist (file formats and flags)

- HF adapter dir must contain: `adapter_config.json`, `adapter_model.safetensors` (or `.bin`), plus `tokenizer.json`/`tokenizer_config.json` if you saved tokenizer.
- `convert_lora_to_gguf.py` flags: `--base` (HF id or local path, used to resolve architecture), `--outfile` (path, supports `{ftype}` template), `--outtype {f32,f16,bf16,q8_0,auto}`, `--no-lazy` (compute eagerly), `--bigendian`. Default is `f32`. For phone adapters use `f16` or `q8_0`.
- `llama-quantize` quant flag: `Q4_K_M` matches current base. Use `Q8_0` for higher fidelity adapter-only GGUF, `f16` if you will merge then requantize.
- Library versions to pin (as of 2026-08-09): `unsloth >= 2025.03` (GGUF+tokenization fixes), `transformers` compatible with Gemma 3 (tested at 4.48+), `peft >=0.13`, `trl >=0.15.0` (Mar 2026) / `0.16+` if available, `llama.rn >=0.11.0`, `llama.cpp` build that includes `convert_lora_to_gguf.py` and `llama-export-lora` / `llama-quantize`.

---

### 3.5 Eval: how to measure format compliance and catch regression

We need two tracks: format compliance (grammar handles most) and helpfulness regression.

#### Track 1: Format and schema compliance (offline, automatic)

Borrow the JSONSchemaBench harness categories:

- **Parsability (ValidJSONRate)**: fraction of samples where `JSON.parse(extractedBlock)` succeeds. Extracted block = first fenced JSON or the whole `response_format` object when using grammar (grammar path should be 1.0 by construction, so this becomes a grammar-smoke check).
- **Schema Correctness Rate**: `V(J,S)` indicator = parse succeeds AND validates against Draft 2020-12 schema; average over samples. Use `jsonschema` (Python) or `ajv` (JS) validator.
- **Missing Rate / Error Rate / Accuracy**: From the rubric common in `Can LLMs Effectively Process and Execute Financial Trading Instructions` lineage and surveys: Generation Rate (format correct), Missing Rate (keys absent), Error Rate (wrong keys), Accuracy (all three clean).
- **Parse Failure Rate (PFR) / Schema Compliance Rate (SCR) / Exact Match (EM)**: as defined at https://arxiv.org/pdf/2606.20072 .

Test splits:

- Small curated eval: 100 prompts (50 expecting chart, 50 expecting no-chart), each with random workout history. A grammar-only setup should score 100% SCR, but will show non-zero wrong-chart-rate (chart emitted when prose alone would be better). A finetune should reduce wrong-chart-rate and improve EM on the numeric data.
- Fuzz eval: generate 200 histories with random lengths (2-12 labels) and assert `labels.length == datasets[0].data.length` and title under 60 chars.

Tooling example:

```python
import json, jsonschema
from jsonschema import validate
schema = json.load(open("chart_schema.json"))
for sample in eval_set:
    try:
        payload = json.loads(extract(sample.output))
        validate(payload, schema)
        correct += 1
    except Exception:
        failures.append(sample.id)
print(f"SCR: {correct}/{len(eval_set)}")
```

In JS on device, reuse `ajv` if bundling, or just `JSON.parse` plus manual shape checks to avoid extra weight.

#### Track 2: Helpfulness and regression (human + LLM judge)

Finetuning can fix format while degrading general coaching quality (Supervised finetuning reduces output diversity 3-8% per https://dev523.medium.com/fine-tuning-large-language-models-on-diverse-textual-data-b8d534465971, plus RLHF-style mode narrowing). Guard with:

- **Holdout of RAG tasks with no chart**: 30-50 prompts that must stay text-only (equipment advice, form cues). Measure refusal-to-add-chart rate; regressions here indicate over-training on JSON.
- **Reward-model or LLM-judge sanity**: Sample 50 outputs before vs after finetune, have a larger model judge helpfulness on a 1-5 Likert scale with blind A/B.
- **Latent-diversity check**: Generate 20 outputs with temp 0.8 and measure distinct 3-gram ratio; collapse below baseline suggests mode collapse.
- **Latency check on device**: Time `context.completion` with and without `json_schema` on a 6GB phone; confirm sampling overhead stays under ~10% and that `n_predict: 300` suffices for the chart JSON.

Gate release on: SCR >= 0.99, no-helpfulness-degradation (judge delta >= -0.2), wrong-chart-rate reduced vs grammar+prompt baseline.

---

## 4. VERDICT DETAILS: Is Finetuning Worth It on a 6-Week Solo Timeline?

**Answer again: grammar-constrained decoding plus few-shot prompting; skip the finetune for v1. Revisit only if field data proves a residual problem the grammar cannot solve.**

Arguments that that will not disappear:

1. **Time vs risk**: On a 6-week timeline with RAG already committed, the highest-leverage chart work is (a) choosing the flat JSON schema above, (b) wiring `response_format: {type:'json_schema'}` or `json_schema: JSON.stringify(schema)` in llama.rn and verifying it rounds-trips to `react-native-chart-kit`, and (c) building the eval harness. A finetune adds 30-800 examples of synthesis and validation time, plus export risk (control-token bug) and an extra 720 MB model artifact to QA on real phones. None of that fits after week 4 without cutting RAG polish.
2. **Diminishing returns after grammar**: If the phone always renders a chart on the Progress screen, the when-to-chart decision disappears. What remains is tone and numeric sanity, both largely addressable by putting workout history in the prompt and asking for 2-sentence advice plus optional chart. Few-shot with 2-3 compact examples is enough to steer brevity at this context length.
3. **Cheap reversible fallback**: If a few cases still emit unhelpful charts, add a second `json_schema` that requires only `{"decision":"chart"|"text"}` as a cheap classifier, then call the full chart schema only when decision==chart, or filter server-free with a regex. Cheaper than a LoRA cycle.
4. **When to revisit finetuning**: After you have 500+ real GymTune conversations, retrain on those real histories rather than synthetic. Real data fixes the grounding problem (invented numbers) that synthetic teacher data struggles with. At that point the minimum viable finetune is: 400-800 examples (70% real, 30% augmented), Unsloth QLoRA r=16-32 all-linears, 2 epochs lr 2e-4, merge to Q4_K_M, and A/B on SCR and judge helpfulness. Budget one weekend on a Colab T4 and one evening for export validation.

If you still want a finetune in v1 as a portfolio piece, scope it to the minimum: do it AFTER the grammar ships, cap at one Unsloth run on 400 examples, and be prepared to cut it and keep the grammar if eval delta is <5 points on wrong-chart-rate or judge score.

---

## APPENDIX: Exact Commands and Versioned References

### HF/PEFT LoRA training (Unsloth, single T4)

```bash
pip install --upgrade --force-reinstall --no-cache-dir unsloth unsloth_zoo
pip install trl peft transformers accelerate datasets bitsandbytes
# On T4 / free Colab, Unsloth will auto-handle float16 vs bfloat16 per https://unsloth.ai/blog/gemma3
```

```python
from unsloth import FastLanguageModel
from trl import SFTTrainer
from transformers import TrainingArguments
from datasets import load_dataset

ds = load_dataset("json", data_files="train.jsonl")["train"]  # each row = {"messages":[...]}
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/gemma-3-1b-it",
    max_seq_length=2048, dtype=None, load_in_4bit=True,
)
model = FastLanguageModel.get_peft_model(model,
    r=32, lora_alpha=32, lora_dropout=0, bias="none",
    target_modules=["q_proj","k_proj","v_proj","o_proj","gate_proj","up_proj","down_proj"],
    use_gradient_checkpointing="unsloth", random_state=3407, use_rslora=False, loftq_config=None,
)
args = TrainingArguments(
    per_device_train_batch_size=2, gradient_accumulation_steps=4,
    warmup_ratio=0.03, num_train_epochs=2, learning_rate=2e-4,
    fp16=False, bf16=False,  # let Unsloth select; on T4 it will use float32 internally
    optim="adamw_8bit", weight_decay=0.01, lr_scheduler_type="linear",
    logging_steps=10, output_dir="outputs", report_to="none",
)
trainer = SFTTrainer(
    model=model, tokenizer=tokenizer, train_dataset=ds, dataset_text_field="text",
    max_seq_length=2048, packing=False, args=args,
)
# Requires chat-templated text; use tokenizer.apply_chat_template under the dataset map
trainer.train()
model.save_pretrained("lora_adapter")
tokenizer.save_pretrained("lora_adapter")
```

### LoRA to GGUF conversion (adapter-only)

```bash
git clone https://github.com/ggml-org/llama.cpp && cd llama.cpp
pip install torch transformers gguf  # per convert_lora_to_gguf.py imports
python convert_lora_to_gguf.py --base google/gemma-3-1b-it --outtype f16 /path/to/lora_adapter --outfile ./gymtune-adapter-f16.gguf
# Verify token types post-export (mitigates Gemma 3 control-token bug #5070)
python -c "import gguf; g=gguf.GGUFReader('gymtune-adapter-f16.gguf'); print([t for t in g.fields if 'token' in t.lower()])"
```

### Merge and requantize (reliable path)

```bash
# HF merge variant
python -c "
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer
base = AutoModelForCausalLM.from_pretrained('google/gemma-3-1b-it', device_map='cpu')
peft = PeftModel.from_pretrained(base, 'lora_adapter')
merged = peft.merge_and_unload()
merged.save_pretrained('merged_fp16')
AutoTokenizer.from_pretrained('google/gemma-3-1b-it').save_pretrained('merged_fp16')
"
python llama.cpp/convert_hf_to_gguf.py merged_fp16 --outfile gymtune-merged-f16.gguf
./llama-quantize gymtune-merged-f16.gguf gymtune-1b-Q4_K_M.gguf Q4_K_M

# GGUF-native merge variant
./bin/llama-export-lora -m gemma-3-1b-it-Q4_K_M.gguf -o gymtune-merged-Q4_K_M.gguf --lora-scaled gymtune-adapter-f16.gguf 1.0
```

### llama.rn usage (constrained JSON on device)

```ts
import { initLlama } from 'llama.rn'
const ctx = await initLlama({ model: 'file://.../gymtune-1b-Q4_K_M.gguf', n_ctx: 2048, n_gpu_layers: 99 })
const schema = { type:'object', required:['title','labels','datasets'], properties:{ title:{type:'string'}, labels:{type:'array',items:{type:'string'}}, datasets:{type:'array',items:{type:'object',required:['label','data'],properties:{label:{type:'string'},data:{type:'array',items:{type:'number'}}}}}}, additionalProperties:false }
const res = await ctx.completion({
  messages: [
    { role:'system', content:'You are GymTune. If a chart helps, output JSON per schema after 2 sentences.' },
    { role:'user', content: `Knowledge: ${chunks}\nHistory: ${historyJson}\nQuestion: ${q}` }
  ],
  response_format: { type:'json_schema', json_schema:{ schema, strict:true } },
  n_predict: 300, stop: ['<end_of_turn>','</s>'],
})
const chart = JSON.parse(res.text)
```

Or low-level: `await ctx.completion({ prompt: templatedPrompt, json_schema: JSON.stringify(schema) })` or `grammar: gbnfString` (equivalent, overridden by grammar if both set).

### Key sources and version anchors

- llama.rn README feature flag Grammar Sampling and README json_schema response_format: https://raw.githubusercontent.com/mybigday/llama.rn/main/README.md
- llama.rn types for `json_schema`/`grammar`/`response_format`/`lora`: https://raw.githubusercontent.com/mybigday/llama.rn/main/src/types.ts and https://raw.githubusercontent.com/mybigday/llama.rn/main/src/index.ts
- llama.rn npm 0.12.8 latest: https://www.npmjs.com/package/llama.rn
- llama.rn LoRA runtime bugs (0.11.x, getLoadedLoraAdapters etc.): https://github.com/mybigday/llama.rn/issues/321
- llama.cpp GBNF and json_schema_to_gbnf: https://github.com/ggml-org/llama.cpp/blob/master/grammars/README.md , https://github.com/ggml-org/llama.cpp/blob/master/examples/json_schema_to_grammar.py
- llama.cpp LoRA GGUF conversion + loader: https://github.com/ggml-org/llama.cpp/blob/master/convert_lora_to_gguf.py , https://instagit.com/ggml-org/llama.cpp/how-to-use-lora-adapters-with-gguf-models/ , https://github.com/ggml-org/llama.cpp/discussions/5360 , https://github.com/ggml-org/llama.cpp/discussions/8663 , https://rentry.co/llama-cpp-conversions
- Unsloth Gemma 3 training fixes (float16 infinity, bfloat16 control): https://unsloth.ai/blog/gemma3 , https://github.com/unslothai/unsloth/issues/2776 , https://github.com/unslothai/unsloth/releases/tag/2025-03
- Gemma 3 GGUF control-token bug #5070: https://github.com/unslothai/unsloth/issues/5070
- Gemma prompt structure (BOS, start_of_turn): https://ai.google.dev/gemma/docs/core/prompt-structure
- JSONSchemaBench harness over ~10k schemas, 1B probe with greedy + jsonschema Draft2020-12: https://arxiv.org/html/2501.10868v3 , https://arxiv.org/pdf/2501.10868 , https://huggingface.co/datasets/epfl-dlab/JSONSchemaBench , https://arxiv.org/html/2604.25359v1
- VAREX document extraction <4B compliance analysis: https://arxiv.org/pdf/2603.15118
- Small LLM benchmark notes: https://ascentcore.com/2026/04/01/small-llm-performance-benchmark/
- Grammar-constrained empty-string likelihood misalignment and loop bugs: https://arxiv.org/pdf/2305.13971 , https://github.com/ggml-org/llama.cpp/issues/19068 , https://github.com/ggml-org/llama.cpp/issues/23677
- QLoRA data-size bands and curated > volume guidance: https://particula.tech/blog/how-much-data-fine-tune-llm , https://arxiv.org/pdf/2603.18037 , https://www.digitalapplied.com/blog/synthetic-data-generation-llm-training-decision-guide-2026 , https://aicompetence.org/train-a-lightweight-llm-with-qlora/
- TRL/Axolotl/Unsloth comparison and version 2026 state: https://dev.to/ultraduneai/eval-003-fine-tuning-in-2026-axolotl-vs-unsloth-vs-trl-vs-llama-factory-2ohg , https://www.spheron.network/blog/axolotl-vs-unsloth-vs-torchtune/ , https://www.hyperbolic.ai/blog/comparing-finetuning-frameworks , https://www.marktechpost.com/2026/07/22/unsloth-vs-axolotl-vs-trl-vs-llama-factory... , https://huggingface.co/docs/trl/index
- Gemma licensing (terms, flow-down, GGUF distribution): https://ai.google.dev/gemma/terms , https://wcr.legal/google-gemma-license-risks/
- react-native-chart-kit legacy vs v2 data shapes: https://github.com/indiespirit/react-native-chart-kit/blob/master/src/line-chart/LineChart.tsx , https://github.com/chart-kit/react-native-chart-kit/blob/main/README.md

### Unverified / flag before shipping

- Exact `CHANGELOG.md` content for llama.rn 0.11.x-0.12.8 could not be fetched via raw endpoint (404), so per-version json_schema introduction point is taken from type inspection of main, not changelog.
- Unsloth fix commit for control-token bug #5070 stated as currently fixing; must re-verify on the `unsloth` version you install that `save_pretrained_gguf` produces CONTROL tokens (type 3) for Gemma 3 ids 105/106.
- Measured GBNF sampling overhead on a 6GB phone with GymTune's 1B Q4_K_M model: run your own microbench (30 charts) rather than relying on published A100 figures.
