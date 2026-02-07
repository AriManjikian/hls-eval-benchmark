from pathlib import Path
import pandas as pd
from utils import compute_pass_rates

RAW_DATA_DIR = Path("raw_data")
OUTPUT_DIR = Path("pass_rate_data")

OUTPUT_DIR.mkdir(exist_ok=True)

for folder in RAW_DATA_DIR.iterdir():
    if not folder.is_dir():
        continue

    csv_path = folder / "all_eval_data.csv"
    if not csv_path.exists():
        continue

    folder_name = folder.name
    if folder_name.startswith("hls_"):
        suffix = folder_name[len("hls_") :]
    else:
        suffix = folder_name

    print(f"Processing {csv_path}")

    df = pd.read_csv(csv_path)

    df_pass = df[
        [
            "eval_id",
            "eval_index",
            "benchmark_case_name",
            "benchmark_case_tags",
            "model_name",
            "pass_parse",
            "pass_compile",
            "pass_tb",
            "pass_synth",
        ]
    ]

    df_pass_rates = compute_pass_rates(df_pass)

    output_path = OUTPUT_DIR / f"pass_rates_{suffix}.csv"
    df_pass_rates.to_csv(output_path, index=False)

    print(f"  → wrote {output_path}")

