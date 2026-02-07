import pandas as pd
import numpy as np


def pass_at_k(n: int, c: int, k: int) -> float:
    if n - c < k:
        return 1.0
    return float(1.0 - np.prod(1.0 - k / np.arange(n - c + 1, n + 1)))


def compute_pass_rates(df: pd.DataFrame, ks=[1, 5]):
    _models = df["model_name"].unique()
    _eval_ids = df["eval_id"].unique()

    data_pass_at_k = []

    for eval_id, df_group in df.groupby("eval_id"):
        # print(f"Eval ID: {eval_id}")
        # print(df_group)
        n_samples = df_group.shape[0]
        n_pass_parse = df_group["pass_parse"].sum()
        n_pass_compile = df_group["pass_compile"].sum()
        n_pass_tb = df_group["pass_tb"].sum()
        n_pass_synth = df_group["pass_synth"].sum()
        n_pass_synth_and_tb = (df_group["pass_tb"] & df_group["pass_synth"]).sum()

        for k in ks:
            pass_at_k_parse = pass_at_k(n_samples, n_pass_parse, k)
            pass_at_k_compile = pass_at_k(n_samples, n_pass_compile, k)
            pass_at_k_tb = pass_at_k(n_samples, n_pass_tb, k)
            pass_at_k_synth = pass_at_k(n_samples, n_pass_synth, k)
            pass_at_k_synth_and_tb = pass_at_k(n_samples, n_pass_synth_and_tb, k)

            pass_at_k_vals = {
                "pass_parse": pass_at_k_parse,
                "pass_compile": pass_at_k_compile,
                "pass_tb": pass_at_k_tb,
                "pass_synth": pass_at_k_synth,
                "pass_synth_and_tb": pass_at_k_synth_and_tb,
            }

            for pass_at_k_key in pass_at_k_vals:
                data_pass_at_k.append(
                    {
                        "eval_id": eval_id,
                        "model_name": df_group["model_name"].iloc[0],
                        "benchmark_case_name": df_group["benchmark_case_name"].iloc[0],
                        "metric_name": pass_at_k_key,
                        "k": k,
                        "pass_rate": pass_at_k_vals[pass_at_k_key],
                    }
                )
    # pprint(data_pass_at_k)
    df_new = pd.DataFrame(
        data_pass_at_k,
        columns=[
            "eval_id",
            "model_name",
            "benchmark_case_name",
            "metric_name",
            "k",
            "pass_rate",
        ],
    )
    # now what we want to do is for each (metric, k) we want to compute the avcge for each model over all evals
    df_agg = (
        df_new.groupby(["model_name", "metric_name", "k"])
        .agg({"pass_rate": "mean"})
        .reset_index()
    )

    return df_agg
