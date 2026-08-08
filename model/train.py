"""
Lightweight LLM finetuning for gym tracking assistance.
Uses LoRA for efficient training on small datasets.
"""

import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    BitsAndBytesConfig,
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from trl import SFTTrainer
from datasets import load_dataset
import os

# Configuration
MODEL_NAME = "microsoft/Phi-3-mini-4k-instruct"  # 3.8B params
OUTPUT_DIR = "./outputs"
DATASET_PATH = "./data/gym_conversations.jsonl"

# Quantization config for memory efficiency
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_use_double_quant=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
)

# LoRA config - lightweight adapter training
lora_config = LoraConfig(
    r=16,  # Low rank
    lora_alpha=32,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
)


def load_model_and_tokenizer():
    """Load base model with quantization and prepare for training."""
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
    tokenizer.pad_token = tokenizer.eos_token
    
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
    )
    
    model = prepare_model_for_kbit_training(model)
    model = get_peft_model(model, lora_config)
    
    print(f"Trainable parameters: {model.print_trainable_parameters()}")
    return model, tokenizer


def prepare_dataset():
    """Load and prepare training dataset."""
    if not os.path.exists(DATASET_PATH):
        print(f"Warning: {DATASET_PATH} not found. Create sample data.")
        return None
    
    dataset = load_dataset("json", data_files=DATASET_PATH, split="train")
    return dataset


def format_prompt(example):
    """Format conversation for training."""
    return {
        "text": f"<|user|>\n{example['user']}<|end|>\n<|assistant|>\n{example['assistant']}<|end|>"
    }


def main():
    print("🏋️ Starting GymTune model training...")
    
    # Load model and data
    model, tokenizer = load_model_and_tokenizer()
    dataset = prepare_dataset()
    
    if dataset is None:
        print("Creating sample dataset for testing...")
        create_sample_dataset()
        dataset = prepare_dataset()
    
    # Training arguments - kept minimal for quick iteration
    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        num_train_epochs=3,
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        learning_rate=2e-4,
        logging_steps=10,
        save_strategy="epoch",
        optim="paged_adamw_8bit",
        fp16=True,
        report_to="none",  # Set to "wandb" if you want tracking
    )
    
    # Train
    trainer = SFTTrainer(
        model=model,
        args=training_args,
        train_dataset=dataset,
        tokenizer=tokenizer,
        dataset_text_field="text",
        max_seq_length=512,
    )
    
    trainer.train()
    
    # Save final model
    model.save_pretrained(f"{OUTPUT_DIR}/final")
    tokenizer.save_pretrained(f"{OUTPUT_DIR}/final")
    
    print("✅ Training complete!")


def create_sample_dataset():
    """Create sample training data for gym tracking conversations."""
    import json
    
    os.makedirs("./data", exist_ok=True)
    
    samples = [
        {
            "user": "I did bench press today: 135x10, 155x8, 175x6",
            "assistant": "Great workout! I've logged your bench press:\n- Set 1: 135 lbs × 10 reps\n- Set 2: 155 lbs × 8 reps\n- Set 3: 175 lbs × 6 reps\n\nYou're progressively overloading - keep it up!"
        },
        {
            "user": "What exercises should I do for back?",
            "assistant": "For a solid back workout, try:\n1. Pull-ups (3×8-12)\n2. Bent-over rows (3×10)\n3. Lat pulldowns (3×12)\n4. Face pulls (3×15)\n\nFocus on squeezing your shoulder blades together."
        },
        {
            "user": "How much progress have I made on squats this month?",
            "assistant": "Let me check your squat progression... [This would access your workout history from markdown files]"
        },
    ]
    
    with open(DATASET_PATH, "w") as f:
        for sample in samples:
            f.write(json.dumps(sample) + "\n")
    
    print(f"Created sample dataset at {DATASET_PATH}")


if __name__ == "__main__":
    main()
