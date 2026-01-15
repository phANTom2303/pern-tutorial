# SQL Injection & Parameterized Queries

## The Problem: String Concatenation
When you concatenate user input directly into a SQL string, the database cannot distinguish between the **command** and the **data**.

**Vulnerable Code:**
```javascript
const query = `SELECT * FROM users WHERE email = '${email}'`;
```

**The Attack:**
If a user enters `' OR '1'='1`, the resulting query becomes:
```sql
SELECT * FROM users WHERE email = '' OR '1'='1'
```
Since `'1'='1'` is always true, the database returns **all rows**. This logic can be used to bypass authentication or delete tables.

## The Solution: Parameterized Queries
Parameterized queries separate the SQL structure from the data.

**Secure Code:**
```javascript
pool.query('SELECT * FROM users WHERE email = $1', [email]);
```

**How It Works:**
1. **Preparation**: The database receives the query structure first (`...WHERE email = $1`). It "locks" the query plan, knowing `$1` is a data slot.
2. **Execution**: The input `' OR '1'='1` is sent separately as a value for `$1`.

**The Result:**
The database searches for a user whose email is literally the string `"' OR '1'='1"`. Since no such user exists, the query fails safely. The input is treated strictly as **text**, not executable **code**.
