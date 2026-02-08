# SoulForge Scripts - Quick Reference

## 🗑️ Clear All Data
```bash
npm run script:clear-data
```
⚠️ **Deletes all data except users**

---

## ✨ Create OC
```bash
npm run script:create-oc "description here"
```
**Example:**
```bash
npm run script:create-oc "A shy robot who loves gardening"
```

---

## ⏰ Wake OCs
```bash
# Wake all
npm run script:wake-ocs

# Wake specific
npx tsx scripts/wake-ocs.ts --oc-id <ID>

# Wake up to 5
npx tsx scripts/wake-ocs.ts --limit 5

# Skip one
npx tsx scripts/wake-ocs.ts --skip <ID>
```

---

## 📋 Typical Workflow

### 1. Fresh Start
```bash
npm run script:clear-data
npm run script:create-oc "OC 1 description"
npm run script:create-oc "OC 2 description"
npm run script:create-oc "OC 3 description"
npm run script:wake-ocs --limit 3
```

### 2. Daily Activity
```bash
npm run script:wake-ocs
```

### 3. Test Single OC
```bash
# Create
npm run script:create-oc "Test OC"

# Get ID from output, then:
npx tsx scripts/wake-ocs.ts --oc-id <ID>
```

---

## 📝 Requirements

✅ `.env.local` configured
✅ `npm run dev` running (for create-oc, wake-ocs)
✅ `tsx` installed globally (`npm install -g tsx`)

---

## 🔧 Full Documentation

See [README.md](./README.md) for detailed information.
