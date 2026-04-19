import sqlite3

def main():
    conn = sqlite3.connect('data.db')
    c = conn.cursor()
    c.execute("INSERT INTO customers (name, mobile) VALUES ('Test Customer', '1234567890')")
    customer_id = c.lastrowid

    for i in range(60):
        c.execute("""
            INSERT INTO invoices (invoice_number, customer_id, type, subtotal, discount, cgst_total, sgst_total, grand_total, status)
            VALUES (?, ?, 'cash', 100, 0, 9, 9, 118, 'active')
        """, (f'INV-{i:03}', customer_id))

    conn.commit()
    conn.close()

if __name__ == "__main__":
    main()
