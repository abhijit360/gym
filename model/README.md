# GymTune Model

Lightweight LLM finetuning for gym tracking assistance using LoRA.

## Setup

```bash
pip install -r requirements.txt
```

## Training

```bash
python train.py
```

This will:
1. Load Phi-3-mini (3.8B params) in 4-bit quantization
2. Apply LoRA adapters (only ~20M trainable params)
3. Finetune on gym-specific conversations
4. Save the adapter weights to `outputs/final/`

## Dataset Format

Create `data/gym_conversations.jsonl` with conversation pairs:

```json
{"user": "I did 3 sets of squats today", "assistant": "Great! What were the weights and reps?"}
{"user": "225x5, 245x5, 265x3", "assistant": "Excellent progression! I've logged:\n- Set 1: 225 lbs × 5 reps\n- Set 2: 245 lbs × 5 reps\n- Set 3: 265 lbs × 3 reps"}
```

## Memory Requirements

- 4-bit quantization: ~2-3GB VRAM
- LoRA training: ~6-8GB VRAM total
- CPU-only: Possible but slow

## Inference

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

base_model = AutoModelForCausalLM.from_pretrained("microsoft/Phi-3-mini-4k-instruct")
model = PeftModel.from_pretrained(base_model, "outputs/final")
tokenizer = AutoTokenizer.from_pretrained("outputs/final")

# Use the model
prompt = "<|user|>\nI did bench press 185x5x3<|end|>\n<|assistant|>\n"
inputs = tokenizer(prompt, return_tensors="pt")
outputs = model.generate(**inputs, max_new_tokens=100)
print(tokenizer.decode(outputs[0]))
```
