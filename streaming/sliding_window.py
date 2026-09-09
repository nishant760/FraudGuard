"""
sliding_window.py
=================
Sliding-window velocity feature tracker for origin accounts (nameOrig).
Maintains state across incoming time steps and computes rolling velocity features:
  - orig_txn_count_window: Number of transactions from this origin account in the last N steps.
  - orig_amount_sum_window: Total transaction amount from this origin account in the last N steps.
  - orig_amount_avg_window: Average transaction amount in the current window.
"""

from collections import deque
from typing import Dict, Tuple, List, Optional
import pandas as pd
import numpy as np


class SlidingWindowTracker:
    """
    Stateful rolling window tracker keyed by nameOrig and step.
    Maintains low memory overhead by automatically expiring records outside the window.
    """

    def __init__(self, window_steps: int = 24):
        """
        :param window_steps: Size of time window in steps (hours in PaySim).
        """
        self.window_steps = window_steps
        # Mapping: nameOrig -> deque of (step, amount)
        self.history: Dict[str, deque] = {}
        # Track latest observed step for opportunistic garbage collection
        self.current_max_step: int = 0

    def update_and_get_features(self, name_orig: str, step: int, amount: float) -> Dict[str, float]:
        """
        Updates the window state with the current transaction and returns the computed velocity features.
        
        :param name_orig: Account ID of the sender.
        :param step: Current simulation/stream step (integer hour).
        :param amount: Current transaction amount.
        :return: Dictionary containing velocity metrics.
        """
        if step > self.current_max_step:
            self.current_max_step = step
            # Periodic cleanup of completely stale accounts every 100 steps
            if self.current_max_step % 100 == 0 and len(self.history) > 10000:
                self._prune_stale_accounts()

        if name_orig not in self.history:
            self.history[name_orig] = deque()

        orig_queue = self.history[name_orig]

        # Purge expired entries older than (step - window_steps)
        min_allowed_step = step - self.window_steps
        while orig_queue and orig_queue[0][0] < min_allowed_step:
            orig_queue.popleft()

        # Compute window features INCLUDING the incoming transaction
        prior_count = len(orig_queue)
        prior_sum = sum(item[1] for item in orig_queue)

        total_count = prior_count + 1
        total_sum = prior_sum + amount
        avg_amount = total_sum / total_count

        # Append current transaction to origin history
        orig_queue.append((step, amount))

        return {
            "orig_txn_count_window": float(total_count),
            "orig_amount_sum_window": float(total_sum),
            "orig_amount_avg_window": float(avg_amount),
        }

    def _prune_stale_accounts(self):
        """Removes origin accounts whose last transaction is outside the active window."""
        cutoff_step = self.current_max_step - self.window_steps
        stale_keys = [
            k for k, q in self.history.items()
            if not q or q[-1][0] < cutoff_step
        ]
        for k in stale_keys:
            del self.history[k]

    def reset(self):
        """Clears all in-memory window state."""
        self.history.clear()
        self.current_max_step = 0


def compute_dataset_velocity_features(df: pd.DataFrame, window_steps: int = 24) -> pd.DataFrame:
    """
    Vectorized / deterministic computation of velocity features over a historical dataframe.
    Ensures that training-time feature values exactly mirror online streaming calculations.
    
    :param df: DataFrame containing ['step', 'nameOrig', 'amount'], sorted by step.
    :param window_steps: Window size in steps.
    :return: DataFrame with the 3 velocity feature columns added.
    """
    df_sorted = df.sort_values(by=["step"]).copy()
    tracker = SlidingWindowTracker(window_steps=window_steps)

    counts = []
    sums = []
    avgs = []

    for name_orig, step, amount in zip(df_sorted["nameOrig"], df_sorted["step"], df_sorted["amount"]):
        feats = tracker.update_and_get_features(name_orig=str(name_orig), step=int(step), amount=float(amount))
        counts.append(feats["orig_txn_count_window"])
        sums.append(feats["orig_amount_sum_window"])
        avgs.append(feats["orig_amount_avg_window"])

    df_sorted["orig_txn_count_window"] = counts
    df_sorted["orig_amount_sum_window"] = sums
    df_sorted["orig_amount_avg_window"] = avgs

    # Restore original index ordering if needed
    return df_sorted.loc[df.index]
