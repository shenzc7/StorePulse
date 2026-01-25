import pandas as pd
import numpy as np

try:
    s = pd.Series([1, np.nan, 3])
    print(f"Pandas version: {pd.__version__}")
    s.fillna(method="ffill")
    print("fillna(method='ffill') works")
except Exception as e:
    print(f"fillna(method='ffill') FAILED: {e}")

try:
    s = pd.Series([1, np.nan, 3])
    s.ffill()
    print("ffill() works")
except Exception as e:
    print(f"ffill() FAILED: {e}")
