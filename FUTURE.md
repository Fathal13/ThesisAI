# 🚀 FUTURE.md — Rencana Skalabilitas & Peningkatan Performa ThesisAI

> **Tujuan:** Panduan langkah-langkah untuk mengatasi throttling, quota habis, dan performa lambat saat user base tumbuh. Setiap step mandiri — bisa dijalankan berurutan atau independen.

---

## 📊 Kondisi Saat Ini (MVP — $0)

| Layer | Provider | Plan | Batas Utama |
|-------|----------|------|-------------|
| **Hosting** | Vercel | Hobby | 100 GB bandwidth/bln, 60s func timeout, 12 func invocations/s, **no commercial use** |
| **Database** | Supabase | Free | 500 MB DB, 1 GB file storage, 50 MAU, 2 juta row reads/bln, 50k row writes/bln |
| **AI Primary** | Google Gemini | Free Tier | 60 RPM (Flash), 1.500 RPM (Flash-Lite), 1.500 RPM (Pro), **no SLA** |
| **AI Fallback** | NVIDIA NIM / OpenRouter / Groq | Free Tier | Rate limit bervariasi, no SLA |
| **Literature Search** | CrossRef API | Public | Polite pool (mailto), ~50 req/s, no full-text |

---

## 🎯 Trigger untuk Upgrade

| Metric | Threshold | Aksi |
|--------|-----------|------|
| Vercel Function Duration > 45s rata-rata | 3 hari berturut | Upgrade Vercel Pro |
| Supabase DB size > 400 MB | 1 minggu | Upgrade Supabase Pro |
| Gemini rate limit hit > 20% requests | 2 hari | Aktifkan DeepSeek V3 fallback |
| User aktif harian > 500 | 1 minggu | Upgrade Vercel + Supabase |
| Literature search timeout > 30% | 1 minggu | Tambah journal API (Scopus/Dimensions) |

---

## 📦 STEP 1 — Upgrade Vercel Hobby → Pro ($20/bln)

### Kenapa?
- **Commercial use allowed** — legal untuk donasi/monetisasi
- **Function timeout 300s** (vs 60s) — AI summary/review panjang tidak terputus
- **Concurrent executions 1000** (vs 12) — handle traffic spike
- **Bandwidth 1 TB** (vs 100 GB) — asset, PDF, image serving
- **Edge Functions / Fluid Compute** — cold start ~0ms, billing per-CPU-ms
- **Analytics + Speed Insights** bawaan
- **Password Protection** untuk staging

### Konfigurasi

```bash
# 1. Upgrade via dashboard
vercel upgrade pro

# 2. Update vercel.ts (sudah pakai @vercel/config)
# vercel.ts
import { routes, deploymentEnv, type VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  framework: 'nextjs',
  buildCommand: 'npm run build',
  devCommand: 'npm run dev',
  installCommand: 'npm install',
  
  # Pro features
  functions: {
    'src/app/api/ai/**/*.ts': {
      maxDuration: 300,        # 5 menit untuk AI review panjang
      memory: 1024,            # 1 GB untuk model besar
      concurrency: 100,        # Fluid compute
    },
    'src/app/api/literature/**/*.ts': {
      maxDuration: 60,
      memory: 512,
    },
  },
  
  # Edge caching untuk static assets
  headers: [
    routes.cacheControl('/static/(.*)', { public: true, maxAge: '1 year', immutable: true }),
    routes.cacheControl('/_next/static/(.*)', { public: true, maxAge: '1 year', immutable: true }),
  ],
  
  # Cron untuk maintenance (cleanup cache, recalculate progress)
  crons: [
    { path: '/api/cron/cleanup-cache', schedule: '0 3 * * *' },      # 3 AM daily
    { path: '/api/cron/recalculate-progress', schedule: '0 */6 * * *' }, # 6 jam sekali
  ],
  
  # Rolling deployment (zero downtime)
  rollingDeployments: true,
  
  # Environment variables (set via `vercel env add`)
  env: {
    NODE_ENV: 'production',
    NEXT_TELEMETRY_DISABLED: '1',
  },
};
```

### Environment Variables (Vercel Dashboard → Settings → Environment Variables)

| Key | Value | Environment |
|-----|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Production, Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Production only |
| `GEMINI_API_KEY` | `AIza...` | Production, Preview |
| `NVIDIA_NIM_API_KEY` | `nvapi_...` | Production, Preview |
| `OPENROUTER_API_KEY` | `sk-or-...` | Production, Preview |
| `GROQ_API_KEY` | `gsk_...` | Production, Preview |
| `DEEPSEEK_API_KEY` | `sk-...` | **Setelah Step 3** |
| `SCOPUS_API_KEY` | `...` | **Setelah Step 4** |
| `AUTH_SECRET` | `openssl rand -base64 32` | Production, Preview |

### Estimasi Biaya Bulanan (Pro)
- Base: **$20**
- Function execution (est. 100k invoc, 500ms avg): ~$5
- Bandwidth (est. 200 GB): ~$10
- **Total ~$35/bln**

---

## 📦 STEP 2 — Upgrade Supabase Free → Pro ($25/bln)

### Kenapa?
- **DB 8 GB** (vs 500 MB) — 16x ruang untuk literatur, summary cache, progress
- **File storage 100 GB** (vs 1 GB) — PDF upload bab, export
- **Realtime + Webhooks** — notifikasi real-time, sync multi-device
- **Point-in-Time Recovery (PITR)** — backup 7 hari, restore ke detik mana pun
- **Read replicas** — skalakan read query (literature search, dashboard)
- **Custom SMTP** — email konfirmasi pakai domain sendiri (`noreply@thesisai.vercel.app`)
- **SSO (SAML/OIDC)** — untuk tim/instansi nanti
- **Log retention 30 hari** (vs 1 hari) — debug production

### Migrasi (Zero Downtime)

```sql
-- 1. Backup existing data (via Supabase Dashboard → Database → Backups)
-- 2. Upgrade plan di Dashboard → Settings → Billing → Upgrade to Pro
-- 3. Enable PITR
ALTER DATABASE postgres SET wal_level = logical;
-- (Supabase handle otomatis setelah upgrade)

-- 4. Add read replica (opsional, untuk traffic tinggi)
-- Dashboard → Database → Read Replicas → Create

-- 5. Increase connection pooler (Supavisor) ke Session mode
-- Dashboard → Database → Connection Pooler → Mode: Session, Pool size: 100

-- 6. Enable custom SMTP
-- Dashboard → Auth → SMTP Settings
-- Host: smtp.resend.com / sendgrid / mailgun
-- Port: 587
-- User: apikey
-- Pass: <API_KEY>
-- Sender: noreply@thesisai.vercel.app
```

### Update `lib/supabase.ts` untuk connection pooling

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Gunakan connection pooler untuk server-side (port 6543)
const supabasePoolerUrl = process.env.SUPABASE_POOLER_URL; // format: postgresql://user:pass@host:6543/postgres

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  // Global fetch options
  global: {
    fetch: (url, options) => {
      return fetch(url, {
        ...options,
        // Timeout 30s untuk query lama
        signal: AbortSignal.timeout(30_000),
      });
    },
  },
});

// Admin client (service role) — hanya server-side
export const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (url, options) => fetch(url, { ...options, signal: AbortSignal.timeout(30_000) }),
      },
    })
  : null;
```

### Update `lib/supabase-admin.ts`

```typescript
// lib/supabase-admin.ts
import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (url, options) => fetch(url, { 
        ...options, 
        signal: AbortSignal.timeout(60_000), // 60s untuk batch job
      }),
    },
    db: {
      schema: 'public',
    },
  });
}
```

### Estimasi Biaya Bulanan (Pro)
- Base: **$25**
- DB size 2 GB: ~$5
- File storage 10 GB: ~$2
- Read replica (opsional): $10
- **Total ~$32-42/bln**

---

## 📦 STEP 3 — Tambah DeepSeek V3 sebagai Fallback AI (Setelah Gemini Free)

### Kenapa DeepSeek V3?
- **Gratis via API resmi** (deepseek.com) — 100 RPM, 500k tokens/hari
- **Performa ~GPT-4o** untuk reasoning, coding, bahasa Indonesia
- **Context 128k** — review bab panjang tanpa chunking
- **Open weight** — opsi self-host nanti kalau butuh SLA
- **Support function calling & JSON mode** — cocok untuk structured output

### Arsitektur Fallback Chain (Updated)

```
Gemini 2.5 Flash (Primary, 60 RPM)
    ↓ rate limit / error / quota
DeepSeek V3 (Free Tier, 100 RPM)  ← NEW
    ↓ rate limit / error
NVIDIA Nemotron 3 Ultra (NIM, free)
    ↓ rate limit / error
OpenRouter (Mistral 7B / Llama 3.1 8B free)
    ↓ rate limit / error
Groq (Llama 3.3 70B Versatile)
    ↓ all failed
AIAllProvidersFailedError → UI: "Semua AI penuh, coba lagi nanti"
```

### Implementasi di `lib/ai.ts`

```typescript
// lib/ai.ts — TAMBAHKAN DeepSeek provider
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createGroq } from '@ai-sdk/groq';

// Provider instances (lazy init)
let deepseek: ReturnType<typeof createDeepSeek> | null = null;

function getDeepSeek() {
  if (!deepseek && process.env.DEEPSEEK_API_KEY) {
    deepseek = createDeepSeek({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com/v1', // Official API
    });
  }
  return deepseek;
}

// Model chain: [primary, fallback1, fallback2, ...]
export const MODEL_CHAIN = [
  { name: 'gemini-2.5-flash', provider: () => google('gemini-2.5-flash'), rpm: 60 },
  { name: 'deepseek-v3', provider: () => getDeepSeek()?.('deepseek-chat'), rpm: 100 }, // NEW
  { name: 'nvidia/nemotron-3-ultra', provider: () => openai('nvidia/nemotron-3-ultra'), rpm: 30 },
  { name: 'mistralai/mistral-7b-instruct:free', provider: () => openrouter('mistralai/mistral-7b-instruct:free'), rpm: 20 },
  { name: 'llama-3.3-70b-versatile', provider: () => groq('llama-3.3-70b-versatile'), rpm: 30 },
] as const;

// Helper: get active provider name for UI badge
export function getActiveProvider(): string {
  // Logic: check which provider last succeeded (stored in cache/redis)
  // Fallback: return first available
  return MODEL_CHAIN.find(m => m.provider())?.name ?? 'none';
}

// Core generate function dengan retry + fallback
export async function generateWithFallback<T>(
  prompt: string,
  schema: z.ZodSchema<T>,
  options: { temperature?: number; maxTokens?: number; system?: string } = {}
): Promise<T> {
  const cacheKey = hashPrompt(prompt + JSON.stringify(schema.shape));
  
  // 1. Check cache first (Redis/Upstash atau Supabase)
  const cached = await getCachedResult<T>(cacheKey);
  if (cached) return cached;

  let lastError: Error | null = null;
  
  for (const model of MODEL_CHAIN) {
    const provider = model.provider();
    if (!provider) {
      console.warn(`[AI] Provider ${model.name} not configured, skipping`);
      continue;
    }

    try {
      const result = await generateObject({
        model: provider,
        prompt,
        schema,
        temperature: options.temperature ?? 0.3,
        maxTokens: options.maxTokens ?? 4096,
        system: options.system,
      });
      
      // Cache success
      await setCache(cacheKey, result.object, 24 * 60 * 60); // 24h TTL
      
      // Update active provider metric
      await incrementProviderSuccess(model.name);
      
      return result.object;
    } catch (error) {
      lastError = error as Error;
      console.warn(`[AI] ${model.name} failed:`, error);
      
      // Rate limit / quota → try next immediately
      if (isRateLimitError(error) || isQuotaError(error)) {
        continue;
      }
      // Safety / content filter → don't fallback (user issue)
      if (isSafetyError(error)) {
        throw new AISafetyError(error.message);
      }
      // Other errors → try next
    }
  }
  
  throw new AIAllProvidersFailedError(lastError?.message ?? 'All AI providers failed');
}
```

### Environment Variable Baru

```bash
# Tambah ke Vercel Dashboard → Environment Variables
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
```

**Dapatkan di:** https://platform.deepseek.com/api_keys (daftar gratis, verifikasi email)

### Rate Limit Handling untuk DeepSeek

```typescript
// lib/ai.ts — tambah tracking per provider
const providerStats = new Map<string, { 
  success: number; 
  rateLimited: number; 
  lastUsed: number;
}>();

export async function incrementProviderSuccess(name: string) {
  const stat = providerStats.get(name) ?? { success: 0, rateLimited: 0, lastUsed: 0 };
  stat.success++;
  stat.lastUsed = Date.now();
  providerStats.set(name, stat);
  
  // Persist ke Upstash Redis / Supabase untuk multi-instance
  await redis.hincrby('ai:provider:stats', `${name}:success`, 1);
}
```

### Estimasi Biaya
- **DeepSeek V3 Free Tier: $0** (100 RPM, 500k tokens/hari)
- **Upgrade ke paid** nanti kalau butuh SLA: $0.14/1M input, $0.28/1M output

---

## 📦 STEP 4 — Tambah Journal API (Scopus, Dimensions, Semantic Scholar, OpenAlex)

### Kenapa?
- **CrossRef hanya metadata** — tidak punya full-text, abstract sering kosong, no citation count
- **Scopus/WEB OF SCIENCE** — coverage paling luas, citation metrics, quartile journal
- **Dimensions** — grant data, clinical trial, policy docs, altmetrics
- **Semantic Scholar** — free API, AI-powered relevance, citation graph, PDF links
- **OpenAlex** — fully open, 250M+ works, author/institution disambiguation, gratis!

### Perbandingan API

| API | Cost | Rate Limit | Coverage | Full-text | Citation Count | Quartile |
|-----|------|------------|----------|-----------|----------------|----------|
| **CrossRef** | Gratis | 50 req/s (polite) | 150M+ DOI | ❌ | ❌ | ❌ |
| **OpenAlex** | Gratis | 100 req/s | 250M+ | ✅ (PDF link) | ✅ | ❌ |
| **Semantic Scholar** | Gratis (academic) | 100 req/5min | 200M+ | ✅ (PDF) | ✅ | ❌ |
| **Dimensions** | Gratis (personal) / $ | 30 req/min | 140M+ | ✅ | ✅ | ✅ |
| **Scopus (Elsevier)** | Berbayar ($$$) | Negosiasi | 80M+ | ✅ | ✅ | ✅ |
| **Web of Science** | Berbayar ($$$$) | Negosiasi | 90M+ | ✅ | ✅ | ✅ |

### Strategi: **Gratis Dulu → Bayar Nanti**

```
Priority 1 (Gratis, Implementasi Sekarang):
├── OpenAlex API — https://api.openalex.org
│   ├── No API key needed (email di header)
│   ├── Filter: type=journal-article, from_publication_date
│   ├── Response: title, authors, abstract, DOI, PDF URL, citations, concepts
│   └── Rate: 100 req/s (generous)
│
├── Semantic Scholar API — https://api.semanticscholar.org
│   ├── API key gratis (daftar academic email)
│   ├── Paper search, recommendations, citations
│   └── Rate: 100 req/5min (dengan key)

Priority 2 (Gratis Personal / Akademik):
├── Dimensions API — https://www.dimensions.ai/api/
│   ├── Register academic email → free tier
│   ├── DSL query language powerful
│   └── Rate: 30 req/min

Priority 3 (Bayar — nanti kalau budget):
├── Scopus API (Elsevier) — ~$5k-15k/tahun
└── Web of Science API (Clarivate) — ~$10k+/tahun
```

### Implementasi di `lib/literature.ts`

```typescript
// lib/literature.ts — NEW unified search
import { openalexSearch, semanticScholarSearch, crossrefSearch } from './literature-providers';

export interface UnifiedPaper {
  title: string;
  authors: string[];
  year: number | null;
  doi: string | null;
  url: string | null;
  pdfUrl: string | null;
  abstract: string | null;
  citationCount: number;
  source: 'crossref' | 'openalex' | 'semanticscholar' | 'dimensions';
  journal: string | null;
  volume: string | null;
  issue: string | null;
  pages: string | null;
  concepts: string[]; // OpenAlex concepts
  isOpenAccess: boolean;
}

export async function unifiedLiteratureSearch(
  query: string,
  options: {
    page?: number;
    perPage?: number;
    yearFrom?: number;
    yearTo?: number;
    journalOnly?: boolean;
    openAccessOnly?: boolean;
  } = {}
): Promise<{ papers: UnifiedPaper[]; total: number; sources: string[] }> {
  const { page = 0, perPage = 20, yearFrom, yearTo, journalOnly, openAccessOnly } = options;
  const results: UnifiedPaper[] = [];
  const sources: string[] = [];

  // Parallel search ke semua source gratis
  const [openalex, semanticscholar, crossref] = await Promise.allSettled([
    openalexSearch(query, { page, perPage, yearFrom, yearTo, journalOnly, openAccessOnly }),
    semanticScholarSearch(query, { page, perPage, yearFrom, yearTo }),
    crossrefSearch(query, { page, perPage, yearFrom, yearTo }),
  ]);

  if (openalex.status === 'fulfilled') {
    results.push(...openalex.value.papers);
    sources.push('openalex');
  }
  if (semanticscholar.status === 'fulfilled') {
    results.push(...semanticscholar.value.papers);
    sources.push('semanticscholar');
  }
  if (crossref.status === 'fulfilled') {
    results.push(...crossref.value.papers);
    sources.push('crossref');
  }

  // Dedupe by DOI (primary) + title similarity (fallback)
  const deduped = deduplicatePapers(results);
  
  // Sort: citation count desc, then year desc, then relevance
  deduped.sort((a, b) => {
    if (b.citationCount !== a.citationCount) return b.citationCount - a.citationCount;
    if ((b.year ?? 0) !== (a.year ?? 0)) return (b.year ?? 0) - (a.year ?? 0);
    return 0;
  });

  return {
    papers: deduped.slice(page * perPage, (page + 1) * perPage),
    total: deduped.length,
    sources,
  };
}

function deduplicatePapers(papers: UnifiedPaper[]): UnifiedPaper[] {
  const seen = new Map<string, UnifiedPaper>(); // key: DOI or normalized title
  
  for (const paper of papers) {
    const key = paper.doi 
      ? `doi:${paper.doi.toLowerCase()}` 
      : `title:${paper.title.toLowerCase().replace(/[^\w\s]/g, '').slice(0, 100)}`;
    
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, paper);
    } else {
      // Merge: keep higher citation count, prefer open access PDF
      if (paper.citationCount > existing.citationCount) {
        seen.set(key, { ...existing, ...paper, citationCount: paper.citationCount });
      } else if (paper.pdfUrl && !existing.pdfUrl) {
        seen.set(key, { ...existing, pdfUrl: paper.pdfUrl });
      }
    }
  }
  
  return Array.from(seen.values());
}
```

### Provider: OpenAlex (`lib/literature-providers/openalex.ts`)

```typescript
// lib/literature-providers/openalex.ts
export async function openalexSearch(query: string, options: SearchOptions) {
  const params = new URLSearchParams({
    search: query,
    'filter': [
      options.journalOnly ? 'type:journal-article' : '',
      options.openAccessOnly ? 'is_oa:true' : '',
      options.yearFrom ? `from_publication_date:${options.yearFrom}-01-01` : '',
      options.yearTo ? `to_publication_date:${options.yearTo}-12-31` : '',
    ].filter(Boolean).join(','),
    'per-page': String(options.perPage ?? 25),
    'page': String((options.page ?? 0) + 1),
    'sort': 'cited_by_count:desc',
    'mailto': 'thesisai@vercel.app', // Polite pool
  }).toString();

  const res = await fetch(`https://api.openalex.org/works?${params}`, {
    headers: { 'Accept': 'application/json' },
    next: { revalidate: 3600 }, // Cache 1 jam
  });

  if (!res.ok) throw new Error(`OpenAlex ${res.status}: ${await res.text()}`);
  
  const data = await res.json();
  
  return {
    papers: data.results.map((work: any) => ({
      title: work.display_name,
      authors: work.authorships?.map((a: any) => a.author.display_name) ?? [],
      year: work.publication_year,
      doi: work.doi?.replace('https://doi.org/', '') ?? null,
      url: work.doi ?? work.id,
      pdfUrl: work.best_oa_location?.url ?? work.open_access?.oa_url ?? null,
      abstract: work.abstract_inverted_index ? invertAbstract(work.abstract_inverted_index) : null,
      citationCount: work.cited_by_count ?? 0,
      source: 'openalex' as const,
      journal: work.host_venue?.display_name ?? null,
      volume: work.biblio?.volume ?? null,
      issue: work.biblio?.issue ?? null,
      pages: work.biblio?.first_page && work.biblio?.last_page 
        ? `${work.biblio.first_page}-${work.biblio.last_page}` 
        : null,
      concepts: work.concepts?.map((c: any) => c.display_name).slice(0, 10) ?? [],
      isOpenAccess: work.open_access?.is_oa ?? false,
    })),
    total: data.meta?.count ?? 0,
  };
}

function invertAbstract(index: Record<string, number[]>): string {
  const words = new Array(Math.max(...Object.values(index).flat()) + 1);
  for (const [word, positions] of Object.entries(index)) {
    for (const pos of positions) words[pos] = word;
  }
  return words.join(' ');
}
```

### Provider: Semantic Scholar (`lib/literature-providers/semanticscholar.ts`)

```typescript
// lib/literature-providers/semanticscholar.ts
const SEMANTIC_SCHOLAR_KEY = process.env.SEMANTIC_SCHOLAR_API_KEY;

export async function semanticScholarSearch(query: string, options: SearchOptions) {
  const params = new URLSearchParams({
    query,
    limit: String(options.perPage ?? 20),
    offset: String((options.page ?? 0) * (options.perPage ?? 20)),
    fields: 'title,authors,year,venue,abstract,citationCount,openAccessPdf,externalIds,publicationTypes',
  });

  if (options.yearFrom) params.append('year', `${options.yearFrom}-${options.yearTo ?? new Date().getFullYear()}`);

  const res = await fetch(`https://api.semanticscholar.org/graph/v1/paper/search?${params}`, {
    headers: {
      'Accept': 'application/json',
      ...(SEMANTIC_SCHOLAR_KEY ? { 'x-api-key': SEMANTIC_SCHOLAR_KEY } : {}),
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) throw new Error(`Semantic Scholar ${res.status}: ${await res.text()}`);
  
  const data = await res.json();
  
  return {
    papers: data.data?.map((paper: any) => ({
      title: paper.title,
      authors: paper.authors?.map((a: any) => a.name) ?? [],
      year: paper.year,
      doi: paper.externalIds?.DOI ?? null,
      url: paper.url ?? `https://www.semanticscholar.org/paper/${paper.paperId}`,
      pdfUrl: paper.openAccessPdf?.url ?? null,
      abstract: paper.abstract,
      citationCount: paper.citationCount ?? 0,
      source: 'semanticscholar' as const,
      journal: paper.venue ?? null,
      volume: null,
      issue: null,
      pages: null,
      concepts: [],
      isOpenAccess: !!paper.openAccessPdf,
    })) ?? [],
    total: data.total ?? 0,
  };
}
```

### Update API Route (`src/app/api/literature/search/route.ts`)

```typescript
// src/app/api/literature/search/route.ts
import { unifiedLiteratureSearch } from '@/lib/literature';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();
  const page = parseInt(searchParams.get('page') ?? '0');
  const perPage = Math.min(parseInt(searchParams.get('perPage') ?? '20'), 50);
  const yearFrom = searchParams.get('yearFrom') ? parseInt(searchParams.get('yearFrom')!) : undefined;
  const yearTo = searchParams.get('yearTo') ? parseInt(searchParams.get('yearTo')!) : undefined;
  const journalOnly = searchParams.get('journalOnly') === 'true';
  const openAccessOnly = searchParams.get('openAccessOnly') === 'true';

  if (!q || q.length < 3) {
    return NextResponse.json({ error: 'Query minimal 3 karakter' }, { status: 400 });
  }

  try {
    const result = await unifiedLiteratureSearch(q, {
      page,
      perPage,
      yearFrom,
      yearTo,
      journalOnly,
      openAccessOnly,
    });

    return NextResponse.json({
      results: result.papers,
      total: result.total,
      page,
      perPage,
      totalPages: Math.ceil(result.total / perPage),
      sources: result.sources,
    });
  } catch (error) {
    console.error('[Literature Search]', error);
    return NextResponse.json({ error: 'Gagal mencari literatur' }, { status: 500 });
  }
}
```

### Environment Variables Baru

```bash
# Vercel Dashboard → Environment Variables
SEMANTIC_SCHOLAR_API_KEY=xxx  # Daftar di https://www.semanticscholar.org/product/api
# OpenAlex: tidak perlu key, cukup email di header
# Dimensions: nanti kalau butuh
```

### Frontend Update (`src/app/dashboard/literature/page.tsx`)

Tambah filter baru:
- ☑ **Open Access saja** (pdf gratis)
- ☑ **Sumber data**: CrossRef / OpenAlex / Semantic Scholar / Semua
- Badge pada hasil: `📄 OA` (open access), `🔗 PDF` (full text tersedia), `📊 N sitasi`

### Estimasi Biaya
| API | Biaya |
|-----|-------|
| OpenAlex | **$0** (gratis selamanya) |
| Semantic Scholar | **$0** (academic tier) |
| Dimensions | **$0** (personal academic) |
| Scopus | ~$5,000-15,000/tahun (nanti) |
| Web of Science | ~$10,000+/tahun (nanti) |

---

## 📋 RINGKASAN EKSEKUSI

| Step | Trigger | Biaya/Bln | Waktu Implementasi | Prioritas |
|------|---------|-----------|-------------------|-----------|
| **1. Vercel Pro** | Func timeout, bandwidth, commercial use | $35 | 30 menit (upgrade + config) | 🔴 **URGENT** jika donasi aktif |
| **2. Supabase Pro** | DB > 400MB, butuh PITR, custom SMTP | $35 | 1 jam (upgrade + migrasi) | 🟡 **HIGH** saat user > 500 |
| **3. DeepSeek V3** | Gemini quota habis > 20% | $0 | 30 menit (add key + update ai.ts) | 🟡 **HIGH** |
| **4. Journal API** | Search timeout > 30%, butuh sitasi | $0 | 2-3 jam (integrasi OpenAlex + S2) | 🟢 **MEDIUM** |

---

## 🔧 CHECKLIST TEKNIS SEBELUM PRODUKSI

### Monitoring & Alerting
- [ ] **Vercel Analytics** + **Speed Insights** aktif
- [ ] **Supabase Logs** → Logflare / Datadog / Grafana Cloud
- [ ] **Upstash Redis** untuk rate limit + cache AI (ganti in-memory)
- [ ] **Sentry** untuk error tracking (gratis 5k events/bln)
- [ ] **Uptime monitoring** (UptimeRobot / Better Uptime)

### Security Hardening
- [ ] **WAF Rules** di Vercel (block SQLi, XSS, bot)
- [ ] **Supabase RLS** audit berkala
- [ ] **Rotate API keys** tiap 90 hari
- [ ] **Dependency audit** `npm audit` + `dependabot`

### Performance
- [ ] **ISR** untuk halaman statis (landing, legal)
- [ ] **Edge caching** untuk literature search (1 jam)
- [ ] **Bundle analyzer** — keep < 200 KB gzipped
- [ ] **Image optimization** — next/image + Vercel Image CDN

### Compliance (Indonesia UU PDP)
- [ ] **Data Processing Agreement** dengan Supabase & Vercel
- [ ] **Privacy Policy** sudah cover AI processing
- [ ] **Right to deletion** — endpoint `/api/user/delete` tested
- [ ] **Consent log** — simpan timestamp consent di `profiles`

---

## 📅 ROADMAP VISUAL

```
NOW (MVP)          │  PHASE 1 (User > 500)     │  PHASE 2 (User > 5k)      │  PHASE 3 (Scale)
───────────────────┼───────────────────────────┼───────────────────────────┼──────────────────
Vercel Hobby       │  ✅ Vercel Pro ($35)       │  Vercel Enterprise        │  Multi-region
Supabase Free      │  ✅ Supabase Pro ($35)     │  Supabase Enterprise      │  Dedicated cluster
Gemini Free        │  ✅ DeepSeek V3 (free)     │  Claude 3.5 Sonnet (paid) │  Self-hosted vLLM
CrossRef only      │  ✅ OpenAlex + S2 (free)   │  Dimensions (academic)    │  Scopus/WoS (paid)
In-memory cache    │  ✅ Upstash Redis (free)   │  Redis Cluster            │  Custom inference
No monitoring      │  ✅ Sentry + Vercel Analytics│ Datadog/Grafana           │  Full observability
```

---

## 💰 ESTIMASI BIAYA BULANAN PER PHASE

| Phase | Vercel | Supabase | AI APIs | Redis | Monitoring | **Total** |
|-------|--------|----------|---------|-------|------------|-----------|
| **MVP (Now)** | $0 | $0 | $0 | $0 | $0 | **$0** |
| **Phase 1** | $35 | $35 | $0 | $0 (Upstash free) | $0 (Sentry free) | **~$70** |
| **Phase 2** | $150+ | $100+ | $50 (Claude) | $50 | $100 | **~$450** |
| **Phase 3** | Custom | Custom | $500+ (self-host GPU) | $200+ | $500+ | **$2,000+** |

> 💡 **Tips:** Phase 1 & 2 bisa ditanggung donasi (Saweria/Ko-fi). Phase 3 butuh model bisnis (B2B ke univ, SaaS).

---

## 📝 CATATAN PENTING

1. **Jangan upgrade sebelum trigger tercapai** — free tier cukup untuk ribuan user bulanan
2. **Test fallback chain** di staging sebelum deploy production
3. **Monitor rate limit headers** (`x-ratelimit-remaining`) dari setiap provider
4. **Cache agresif** — literature search cache 1 jam, AI summary cache 24 jam
5. **Graceful degradation** — UI tetap jalan meski AI down (show cached, disable AI buttons)
6. **Document every change** — update `PROGRESS.md` dan `CHANGELOG.md` tiap deploy

---

*Dokumen ini living document — update saat arsitektur berubah. Last updated: 2026-07-12*