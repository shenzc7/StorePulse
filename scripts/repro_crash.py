import numpy as np
import pandas as pd
from ml.train_ingarch import NBINGARCHModel

# Create synthetic data
np.random.seed(42)
y = np.random.poisson(10, size=100).astype(float)
exog = np.random.normal(0, 1, size=(100, 2))

print("Fitting model...")
try:
    model = NBINGARCHModel(y, exog=exog, p=1, q=1)
    model.fit(maxiter=10)
    print("Fit successful!")
except Exception as e:
    import traceback
    print(f"Fit FAILED: {e}")
    traceback.print_exc()
