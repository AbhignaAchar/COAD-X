# COAD-X | Cyber Forensic Intelligence & Evidence Reconstruction Platform

> **Hackathon Problem Statement**: AI-Assisted Intelligent Data Recovery and Digital Evidence Reconstruction

COAD-X is a modern, full-stack digital forensics and evidence reconstruction prototype built with **React**, **Vite**, **CSS**, **Web Crypto API**, and **jsPDF**. It operates 100% client-side in browser memory to inspect file signatures, analyze byte fragment entropy, reassemble missing data blocks, compute SHA-256 cryptographic checksums, and generate PDF forensic reports.

---

## 🚀 Key Features & Pages

1. **Dashboard (`/`)**
   - In-memory metrics: Total Evidence Files, Fragments Found, Reconstructed Files, and Cryptographic Verified Status.
   - Interactive 6-step recovery pipeline tracker (Upload → Scan → Classify → Match → Reconstruct → Verify).
   - Quick action shortcuts and system status stream.

2. **Digital Evidence Ingestion (`/upload`)**
   - Drag-and-drop zone and native file selector supporting `TXT`, `JPG`, `PNG`, `PDF`, `ZIP`, `WAV`, `GIF`, and raw binary fragments.
   - Session storage in browser memory (`ArrayBuffer` / `Uint8Array`).
   - Built-in "Load Sample Evidence" feature for immediate demonstration.

3. **Byte Fragment & Hex Scanner (`/scanner`)**
   - Magic byte header inspector matching against standard file signature dictionaries (`FF D8 FF`, `89 50 4E 47`, `%PDF`, `PK..`).
   - 1KB block slicer calculating offset ranges, Shannon entropy scores, and source tags.
   - Integrated interactive **Hex & ASCII Editor Viewer** displaying offsets, 16-byte hex sequences, and decoded ASCII characters.

4. **File Signature & Format Classification (`/classification`)**
   - Header magic byte matching vs. declared MIME types.
   - Confidence scoring algorithm (100% Signature Match, 90% Text Heuristic, 30% Unknown Binary).
   - Complete supported magic signature dictionary reference table.

5. **Evidence & Fragment Dependency Graph (`/graph`)**
   - Interactive SVG topology node map visualizing parent file nodes and child fragment sectors.
   - Color-coded links distinguishing **Verified Parent Links** from **Inferred Offset Links**.
   - Inspector panel detailing offset boundaries, parent IDs, and raw byte snippets.

6. **Byte Fragment Reconstruction Workspace (`/reconstruction`)**
   - Custom fragment selector allowing users to pick byte chunks and reassemble them in offset order.
   - Interactive **Fragment Reassembly Puzzle Solver Demo** mode.
   - Download button for reassembled outputs.
   - Bitwise hash verification comparing reconstructed SHA-256 against source reference.

7. **Cryptographic SHA-256 Integrity Verification (`/integrity`)**
   - Web Crypto API SHA-256 hash calculator.
   - Status badges: `Verified (Match)`, `Mismatch`, or `Not Available`.
   - Forensic authenticity disclaimer explaining hash content identity vs. physical chain-of-custody.

8. **AI Forensic Copilot & Analyzer (`/copilot`)**
   - Automated rule-based evidence analysis panel summarizing header integrity, high-entropy sectors, and investigative recommendations.
   - Interactive Q&A chat assistant with quick preset prompts.
   - Transparently labeled as automated rule-based analysis.

9. **Recovery Feasibility & Priority Matrix (`/priority`)**
   - Objective feasibility scoring formula (Header Intactness 50%, Sector Availability 30%, Hash Verification 20%).
   - Priority rankings (`High`, `Medium`, `Low`) based on measurable byte properties.

10. **Forensic Audit PDF Report Generator (`/reports`)**
    - Instant client-side PDF export generated via `jsPDF` and `jspdf-autotable`.
    - Includes Case Reference ID, Investigator details, Ingested File Hashes, Fragment Summaries, Verification Matrix, and Disclaimers.

---

## 🛠️ Tech Stack & Dependencies

- **Frontend Framework**: React 18 + Vite
- **Styling**: Vanilla CSS with Cyber Dark Navy Theme (`#0b132b`), Cyan Highlights (`#06b6d4`), and Glassmorphism design system.
- **Icons**: `lucide-react`
- **PDF Export**: `jspdf`, `jspdf-autotable`
- **Hashing**: Browser Native `window.crypto.subtle.digest('SHA-256', ...)`

---

## 📦 Installation & Setup

1. **Clone or Navigate to Project Directory**:
   ```bash
   cd COAD-X
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Local Development Server**:
   ```bash
   npm run dev
   ```

4. Open your browser at `http://localhost:3000` to access COAD-X.

---

## 🛡️ Security & Privacy Guarantee

- **100% In-Memory Processing**: All uploaded evidence files remain strictly inside your local browser memory (`ArrayBuffer`). No data is sent to external servers or databases.
- **Non-Destructive**: COAD-X does not scan, alter, or write to your physical disk partitions.
