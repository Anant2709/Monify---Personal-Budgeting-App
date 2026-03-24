import random
from datetime import date, timedelta
from .database import engine, SessionLocal, Base
from .models import Transaction, Category, Merchant

CATEGORY_NAMES = [
    "Groceries", "Dining", "Rent", "Utilities", "Subscriptions",
    "Entertainment", "Transport", "Shopping", "Health",
    "Salary", "Side Income",
]

MERCHANT_DATA = {
    "Groceries": [
        ("Whole Foods", 45, 120), ("Trader Joe's", 30, 80), ("Costco", 80, 250),
        ("Safeway", 25, 70), ("Walmart Grocery", 35, 90),
    ],
    "Dining": [
        ("Chipotle", 12, 18), ("Starbucks", 5, 9), ("Olive Garden", 25, 55),
        ("DoorDash", 18, 45), ("Subway", 8, 14), ("Pizza Hut", 15, 30),
    ],
    "Rent": [("Apartment Rent", 1800, 1800)],
    "Utilities": [
        ("Electric Company", 60, 130), ("Water Bill", 30, 50),
        ("Internet - Comcast", 70, 70), ("Gas Company", 25, 60),
    ],
    "Subscriptions": [
        ("Netflix", 15.49, 15.49), ("Spotify", 10.99, 10.99),
        ("ChatGPT Plus", 20, 20), ("iCloud", 2.99, 2.99),
        ("Amazon Prime", 14.99, 14.99), ("Gym Membership", 45, 45),
    ],
    "Entertainment": [
        ("AMC Theatres", 15, 30), ("Steam", 10, 60), ("Concert Tickets", 50, 150),
        ("Bowling Alley", 20, 40), ("Barnes & Noble", 10, 35),
    ],
    "Transport": [
        ("Shell Gas", 35, 65), ("Uber", 12, 35), ("Lyft", 10, 30),
        ("Parking Meter", 3, 10), ("Car Wash", 15, 25),
    ],
    "Shopping": [
        ("Amazon", 15, 120), ("Target", 20, 80), ("Nike", 50, 150),
        ("Best Buy", 30, 200), ("IKEA", 25, 150),
    ],
    "Health": [
        ("CVS Pharmacy", 10, 50), ("Doctor Copay", 30, 30),
        ("Dental Checkup", 50, 50), ("Walgreens", 8, 30),
    ],
}

INCOME_SOURCES = [
    ("Employer - Direct Deposit", "Salary", 3200),
    ("Freelance Payment", "Side Income", 200),
]

CATEGORY_FREQUENCY = {
    "Groceries": 8, "Dining": 12, "Rent": 1, "Utilities": 3,
    "Subscriptions": 5, "Entertainment": 3, "Transport": 6,
    "Shopping": 4, "Health": 2,
}


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if db.query(Transaction).count() > 0:
        db.close()
        return

    # --- Seed categories ---
    cat_map = {}
    for name in CATEGORY_NAMES:
        cat = Category(name=name)
        db.add(cat)
        db.flush()
        cat_map[name] = cat.id

    # --- Seed merchants ---
    merch_map = {}
    all_merchant_names = set()
    for merchants in MERCHANT_DATA.values():
        for name, _, _ in merchants:
            all_merchant_names.add(name)
    for src_name, _, _ in INCOME_SOURCES:
        all_merchant_names.add(src_name)

    for name in sorted(all_merchant_names):
        m = Merchant(name=name)
        db.add(m)
        db.flush()
        merch_map[name] = m.id

    # --- Seed transactions ---
    transactions = []
    today = date.today()
    start_date = today - timedelta(days=90)

    for month_offset in range(3):
        month_start = start_date + timedelta(days=month_offset * 30)

        # Income: two paychecks per month + occasional freelance
        for paycheck in range(2):
            pay_date = month_start + timedelta(days=paycheck * 15 + random.randint(0, 2))
            if pay_date > today:
                continue
            transactions.append(Transaction(
                date=pay_date,
                merchant_id=merch_map[INCOME_SOURCES[0][0]],
                amount=INCOME_SOURCES[0][2],
                category_id=cat_map[INCOME_SOURCES[0][1]],
                description="Bi-weekly paycheck",
                type="income",
            ))

        if random.random() > 0.4:
            fl_date = month_start + timedelta(days=random.randint(5, 25))
            if fl_date <= today:
                transactions.append(Transaction(
                    date=fl_date,
                    merchant_id=merch_map[INCOME_SOURCES[1][0]],
                    amount=round(random.uniform(150, 500), 2),
                    category_id=cat_map[INCOME_SOURCES[1][1]],
                    description="Freelance web dev project",
                    type="income",
                ))

        # Expenses
        for category, freq in CATEGORY_FREQUENCY.items():
            merchants = MERCHANT_DATA[category]
            month_variation = 1.0 + (month_offset - 1) * random.uniform(-0.1, 0.15)
            count = max(1, int(freq * month_variation + random.randint(-1, 1)))

            for _ in range(count):
                merchant_name, low, high = random.choice(merchants)
                tx_date = month_start + timedelta(days=random.randint(0, 29))
                if tx_date > today:
                    continue

                amount = round(random.uniform(low, high), 2)
                if category == "Dining" and month_offset == 2:
                    amount = round(amount * random.uniform(1.2, 1.5), 2)

                transactions.append(Transaction(
                    date=tx_date,
                    merchant_id=merch_map[merchant_name],
                    amount=amount,
                    category_id=cat_map[category],
                    description=f"{category} purchase at {merchant_name}",
                    type="expense",
                ))

    db.add_all(transactions)
    db.commit()
    db.close()
    print(f"Seeded {len(transactions)} transactions across {len(cat_map)} categories and {len(merch_map)} merchants")
