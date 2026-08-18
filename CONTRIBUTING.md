# Contributing to RailPulse

Thank you for your interest in contributing to **RailPulse**! We welcome contributions to enhance train tracking algorithms, scheduling optimization, UI components, and cloud infrastructure.

---

## Code of Conduct
Please maintain a respectful, professional, and welcoming environment for all contributors.

## How to Contribute

### 1. Fork & Clone
```bash
git clone https://github.com/a7hu-15/train-schedule-devops.git
cd train-schedule-devops
```

### 2. Set Up Local Development
- **Backend**:
  ```bash
  cd backend
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
  PYTHONPATH=. pytest tests/
  ```
- **Frontend**:
  ```bash
  cd frontend
  npm install
  npm run dev
  ```

### 3. Commit Guidelines
Use clear conventional commit messages:
- `feat(backend): ...`
- `feat(frontend): ...`
- `infra: ...`
- `ci: ...`
- `docs: ...`

### 4. Create Pull Request
Submit a pull request against the `main` branch with clear description and verification steps.

