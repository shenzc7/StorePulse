import pytest
import numpy as np
import pandas as pd
from ml.train_ingarch import NBINGARCHModel

@pytest.fixture
def synthetic_data():
    """Generate synthetic count data with autoregressive pattern."""
    np.random.seed(42)
    n = 200
    # AR(1) process: y_t = 5 + 0.5 * y_{t-1} + noise
    y = np.zeros(n)
    y[0] = 10
    for t in range(1, n):
        mu = 5 + 0.5 * y[t-1]
        y[t] = np.random.negative_binomial(n=10, p=10/(10+mu)) # Overdispersed
    return y

def test_model_initialization(synthetic_data):
    """Test that model initializes with correct parameters."""
    model = NBINGARCHModel(synthetic_data, p=1, q=1)
    assert model.n_obs == 200
    assert model.p == 1
    assert model.q == 1
    assert model.endog.dtype == float

def test_model_fit(synthetic_data):
    """Test that model fitting runs and produces parameters."""
    model = NBINGARCHModel(synthetic_data, p=1, q=1)
    model.fit(maxiter=50) # Short run for testing
    
    assert model.params is not None
    assert len(model.params) == 1 + 1 + 1 + 1 # beta0, beta1, alpha0, alpha1
    assert model.loglik < 0 # Log-likelihood should be negative

def test_model_predict(synthetic_data):
    """Test prediction shape and values."""
    model = NBINGARCHModel(synthetic_data, p=1, q=1)
    model.fit(maxiter=50)
    
    preds = model.predict(n_ahead=7)
    assert len(preds) == 7
    assert np.all(preds >= 0) # Predictions must be non-negative

def test_edge_case_zeros():
    """Test model behavior with all zeros (should not crash)."""
    zeros = np.zeros(50)
    model = NBINGARCHModel(zeros, p=1, q=1)
    model.fit(maxiter=10)
    preds = model.predict(n_ahead=5)
    assert len(preds) == 5
    assert np.all(preds >= 0)

def test_edge_case_short_series():
    """Test model with very short series."""
    short = np.array([10, 12, 11, 13, 10])
    model = NBINGARCHModel(short, p=1, q=1)
    model.fit(maxiter=10)
    preds = model.predict(n_ahead=2)
    assert len(preds) == 2
