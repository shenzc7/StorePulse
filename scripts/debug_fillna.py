import pandas as pd
import inspect

_orig_fillna = pd.Series.fillna

def _patched_fillna(self, *args, **kwargs):
    if 'method' in kwargs:
        stack = inspect.stack()
        for frame in stack[1:5]:
            print(f"DEBUG: fillna(method=...) called from {frame.filename}:{frame.lineno}")
    return _orig_fillna(self, *args, **kwargs)

pd.Series.fillna = _patched_fillna
pd.DataFrame.fillna = _patched_fillna

s = pd.Series([1, None, 3])
try:
    s.fillna(method='ffill')
except Exception as e:
    print(f"CAUGHT: {e}")
