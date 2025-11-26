# StorePulse: The Project Bible
> **"Know tomorrow's visits. Act today."**

## 👋 Welcome, Project Owner
This document is your key to owning, understanding, and explaining StorePulse. It is written in plain English so you don't need a PhD in Statistics to understand how it works.

---

## 1. What is StorePulse? (The Elevator Pitch)
StorePulse is a desktop app that tells store managers **how many customers will walk in the door next week**.

**The Problem:**
- Managers guess how many staff they need.
- **Guess too low?** Long lines, angry customers, lost sales.
- **Guess too high?** Staff standing around doing nothing (wasted money).

**The Solution:**
StorePulse looks at history (what happened last year) and context (is it a weekend? is it raining?) to give a scientific prediction. It helps managers schedule the *exact* right number of staff.

---

## 2. The Secret Sauce: NB-INGARCH
Most forecasting tools use simple averages ("Just use the average of the last 3 Mondays"). **This is wrong** because retail is chaotic.

StorePulse uses a special model called **NB-INGARCH**. Here is the plain English explanation:

### The "Bus Stop" Analogy
Imagine you are predicting how many people will wait at a bus stop.
1.  **The Habit (Autoregression)**: If 50 people came yesterday, probably around 50 will come today.
2.  **The Context (Exogenous)**: Is it raining? Fewer people. Is it a holiday? More people.
3.  **The Chaos (Volatility)**: Some days are just "wilder" than others. Weekends are chaotic; Tuesdays are predictable.

**NB-INGARCH** is smart because it predicts two things:
1.  **The Count**: "Expect 50 people."
2.  **The Risk**: "But it could be as low as 40 or as high as 80." (This is the "Volatility" part).

**Why "Negative Binomial"?**
Because in retail, the "variance" (chaos) is usually much higher than the "average". Standard models fail here. Negative Binomial was *born* for this chaos.

---

## 3. Under the Hood (The Map)
If you need to fix or change something, here is where you go.

### 🧠 The Brain (`ml/train_ingarch.py`)
This file contains the math. It uses a method called "Maximum Likelihood" to find the best numbers for the model.
- **Don't touch this** unless you know statistics.

### 🚦 The Traffic Controller (`api/routes/forecast.py`)
This is the API. When the frontend asks "Give me the forecast," this file:
1.  Checks if a model exists.
2.  Loads the latest data.
3.  Asks "The Brain" for the numbers.
4.  Sends the answer back to the app.

### 📚 The Librarian (`api/core/db.py`)
This manages the database (`storepulse.db`). It saves every visit, every prediction, and every setting. It ensures your data is safe even if the power goes out.

### 🎨 The Face (`src/pages/forecast/forecastPage.tsx`)
This is the React code that draws the charts. It takes the boring numbers from the API and turns them into beautiful graphs and "Staffing Recommendations."

---

## 4. How to Maintain It
You own this now. Here is how to keep it alive.

### Monthly Routine
1.  **Upload New Data**: Go to the "Data" tab and upload the latest month's sales/visits.
2.  **Retrain**: Click "Train Model". This teaches the AI about the latest trends (e.g., "Saturdays are getting busier").

### Troubleshooting
- **"It says No Model Found"**: You haven't trained it yet! Go to the "Train" tab.
- **"The forecast looks crazy"**: Check your data. Did you upload a file where "Visits" was 0 for a whole week? Garbage in, garbage out.

### Deployment
To give this to a friend or client:
1.  Run `npm run tauri build`.
2.  Give them the `.dmg` (Mac) or `.exe` (Windows) file.
3.  That's it! They don't need Python or anything installed.

---

## 5. The "Viva" Cheat Sheet
If someone asks you these questions, here are the answers:

**Q: Why didn't you use a simple Moving Average?**
A: "Averages are too slow. They miss sudden changes like holidays or promotions. Our model reacts instantly."

**Q: Why not use a fancy Deep Learning model (LSTM)?**
A: "Those need millions of data points. Retailers usually only have a few years of history. NB-INGARCH works perfectly with small data."

**Q: Is my data safe?**
A: "Yes. Everything runs 100% offline on your laptop. Nothing is sent to the cloud."

---
*Built with ❤️ by the shenz .*
