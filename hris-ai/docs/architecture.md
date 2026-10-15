# IOH-RAG-POC System Architecture

## 1. Architectural Philosophy

The IOH-RAG-POC pipeline follows core principles defined in the [Project Constitution](file:///.specify/memory/constitution.md):

1. **Modular & Decoupled Pipeline (Adapter Pattern)**: Each stage is an isolated module communicating across strongly-typed interface contracts. Third-party frameworks (e.g. LangChain, LlamaIndex, pypdf) are encapsulated behind adapter boundaries. Domain models never inherit framework classes.
2. **Grounding & Verifiable Citations**: Every generated statement must attribute traceable source chunk citations (`chunk_id`, `char_start`, `char_end`, `page_number`).
3. **Traceable Audit & Data Governance**: Every `Document` and `DocumentChunk` records deterministic IDs, actor identities (`created_by`, `updated_by`), ISO 8601 UTC timestamps (`created_at`, `updated_at`), and raw content hashes (`content_hash`).
4. **Metric-Driven Evaluation**: Measurable quantitative benchmarks (Recall, Precision, MRR, Faithfulness).
5. **Data Governance & Security**: Strict boundary isolation and zero committed credentials.
6. **Simplicity & YAGNI**: Lightweight local embedded baselines before introducing distributed infrastructure.

---

## 2. Pipeline Process Breakdown

```text
[ Raw Documents (.txt, .md, .pdf) ]
       │
       ▼
┌──────────────────┐
│  src/ingestion/  │──► DocumentLoaderRegistry & Loaders (Text, Markdown, PDF via pypdf)
└──────────────────┘    Outputs: standardized Document records with audit hashes & timestamps
       │ (Document)
       ▼
┌──────────────────┐
│  src/indexing/   │──► Chunkers (LangChainRecursiveChunker adapter),
└──────────────────┘    Embedders (BgeM3Embedder adapter, 1024-dim BAAI/bge-m3),
       │ (DocumentChunk) Vector Stores (ChromaVectorStore adapter, PersistentClient)
       ▼                Outputs: Idempotent records with normalized similarity scoring [0.0, 1.0]
┌──────────────────┐
│  src/retrieval/  │──► DenseRetriever adapter, metadata filtering (where),
└──────────────────┘    Score thresholding & ContextFormatter prompt blocks
       │ (Retrieved context & citations)
       ▼
┌──────────────────┐
│ src/generation/  │──► Prompt synthesis, grounded generation, LLM client
└──────────────────┘
       │
       ▼
[ Grounded Answer + Citations ]
```

---

## 3. Implemented Subsystems


### 3.1 Document Ingestion Subsystem (`src/ingestion/`)
- **Abstract Contract**: `BaseDocumentLoader` defining `supports(file_path: Path) -> bool` and `load(file_path: Path, actor: str) -> Document`.
- **Adapters**:
  - `TextDocumentLoader`: Ingests UTF-8 / Latin-1 plain text (`.txt`) files.
  - `MarkdownDocumentLoader`: Ingests Markdown files (`.md`, `.markdown`).
  - `PDFDocumentLoader`: Ingests digital PDFs via `pypdf`, preserving page counts and page-level metadata.
- **Service & Registry**:
  - `DocumentLoaderRegistry`: Maps file extensions to registered loader instances.
  - `DocumentIngestionService`: Provides single (`ingest_file`) and resilient batch (`ingest_batch`) ingestion with error isolation (`IngestionBatchResult`, `IngestionFailure`).
- **Audit Lineage**:
  - `Document`: Data contract tracking `id` (`doc_{hash[:16]}`), `content_hash` (SHA-256), `source_path`, `file_type`, `file_size_bytes`, `created_at`, `created_by`, `updated_at`, `updated_by`, and `metadata`.

### 3.2 Text Chunking Subsystem (`src/indexing/`)
- **Abstract Contract**: `BaseChunker` defining `chunk_document(...)` and `chunk_documents(...)`.
- **Adapter**:
  - `LangChainRecursiveChunker`: Wraps LangChain's `RecursiveCharacterTextSplitter` within `src/indexing/adapters/`. Prevents leaking LangChain dependencies into core domain logic.
- **Lineage Attribution & Coordinates**:
  - `DocumentChunk`: Immutable data contract tracking:
    - `chunk_id`: Deterministic identifier in the format `{document_id}#c{chunk_index:04d}`.
    - `document_id`: Parent document ID reference.
    - `chunk_index`: 0-indexed sequential position.
    - `text`: Chunk text segment.
    - `char_start` & `char_end`: Exact character coordinates in parent `Document.content`, satisfying `doc.content[char_start:char_end] == chunk.text`.
    - `created_at` & `created_by`: Audit actor and timestamp propagation.
    - `page_number`: Mapped page number from document metadata.
    - `metadata`: Parent document metadata merged with chunk-level lineage attributes.

### 3.3 Multilingual Embedding Engine & Vector Store Subsystem (`src/indexing/`)
- **Abstract Contracts**:
  - `BaseEmbedder`: Defines `embed_texts(texts: Sequence[str]) -> Sequence[Sequence[float]]` and `embed_query(query: str) -> Sequence[float]`.
  - `BaseVectorStore`: Defines `add_chunks(chunks, embeddings)` and `similarity_search(query_embedding, top_k, where)`.
- **Concrete Adapters**:
  - `BgeM3Embedder` (`src/indexing/adapters/bge_embedder.py`):
    - Wraps `sentence-transformers` loading `BAAI/bge-m3` producing 1024-dimensional dense vectors.
    - Automatically discovers CUDA acceleration with graceful fallback to CPU.
    - Isolates local model weights in `data/cache/models/` (customizable via `MODEL_CACHE_DIR`).
    - Enforces sequence length boundary rules: rejects oversized chunks per-item (`ContextLengthExceededError`) to safeguard vector index fidelity, and gracefully truncates queries.
    - Automatically recovers from CUDA Out-Of-Memory (OOM) by falling back to CPU execution.
  - `ChromaVectorStore` (`src/indexing/adapters/chroma_store.py`):
    - Uses embedded `chromadb.PersistentClient` targeting `data/vector_store/chroma/`.
    - Manages a unified collection (`rag_documents`) configured with cosine distance (`{"hnsw:space": "cosine"}`).
    - Guarantees idempotent upserts keyed by deterministic `chunk_id`.
    - Serializes and sanitizes lineage metadata: preserves scalar primitives (`int`, `str`, `float`, `bool`), maps `page_number=None` to `-1`, and JSON-serializes nested objects.
    - Converts Chroma cosine distances into normalized similarity scores ($S = \max(0.0, \min(1.0, 1.0 - d))$ in $[0.0, 1.0]$).
    - Supports metadata filtering via Chroma `where` clauses (e.g. `{"file_type": "pdf"}`).

### 3.4 Context Retrieval & Citation Subsystem (`src/retrieval/`)
- **Abstract Contracts**:
  - `BaseRetriever`: Defines `retrieve(query, top_k, where, score_threshold)` returning `Sequence[RetrievalResult]` and `retrieve_context(...)` returning `RetrievedContext`.
  - Value Objects: `RetrievalQuery` (with validation), `RetrievalResult` (with 1-based `rank` and normalized `score`), `RetrievedContext`, `FormattedContext`.
- **Concrete Adapters & Helpers**:
  - `DenseRetriever` (`src/retrieval/adapters/dense_retriever.py`):
    - Uses constructor dependency injection accepting `BaseEmbedder` and `BaseVectorStore`.
    - Automatically short-circuits empty or whitespace-only queries to `[]` without compute.
    - Encodes query via `embedder.embed_query` (inheriting truncation and CUDA OOM fallback).
    - Queries vector store with metadata filtering (`where`).
    - Applies post-retrieval `score_threshold` cutoff (default `None`), cleanly signaling abstention on ungrounded queries.
  - `ContextFormatter` (`src/retrieval/formatter.py`):
    - Standardizes prompt context assembly with numbered reference headers (`[1] [Source: doc.pdf | Chunk: id | Page: X | Score: Y]\n<text>`).
    - Produces structured citation metadata lists for verifiable generation attribution.

### 3.5 Grounded Generation Subsystem (`src/generation/`)
- **Abstract Contract**: `BaseGenerator` defining `generate(query: str, context: Sequence[RetrievalResult]) -> GenerationResult`.
- **Domain Value Objects**:
  - `GenerationConfig`: Immutable configuration supporting provider selection (`openai`, `anthropic`), model names, custom `base_url` (Sumopod), API keys, temperature, max tokens, and timeout/retries.
  - `Citation`: Immutable domain object tracking `document_id`, `chunk_id`, `relevance_score`, and source `reference_snippet`.
  - `GenerationResult`: Unified response envelope containing `query`, `answer`, `citations`, and `has_sufficient_context` flag.
- **Concrete Adapters & Factory**:
  - `OpenAIGenerator` (`src/generation/adapters/openai_generator.py`):
    - Connects to OpenAI Chat Completion endpoints and third-party gateways (e.g. **Sumopod**) via configurable `base_url`.
    - Handles automatic exponential backoff retries for transient HTTP 429 and 5xx errors.
  - `AnthropicGenerator` (`src/generation/adapters/anthropic_generator.py`):
    - Connects to Anthropic Messages endpoints and third-party gateways (e.g. **Sumopod**) via configurable `base_url`.
    - Handles automatic exponential backoff retries for transient network faults.
  - `get_generator` (`src/generation/factory.py`):
    - Plug-and-play factory resolving configuration from unified environment variables (`LLM_PROVIDER`, `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`) with graceful fallback to standard provider variables (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`).
- **Prompt Engineering & Citation Attribution Engine**:
  - `build_grounded_messages` (`src/generation/prompt.py`): Enforces strict context grounding, instructs in-text bracketed citation notation (`[1]`, `[2]`), enforces bilingual language matching, and embeds context blocks via `ContextFormatter`.
  - `parse_citations` (`src/generation/citation.py`): Resolves `\[(\d+)\]` citation markers back to retrieved chunks with boundary checking, and intercepts sentinel `[INSUFFICIENT_CONTEXT]` to set `has_sufficient_context = False` with polite localized refusal.
  - Credential Sanitization: `sanitize_message` (`src/generation/exceptions.py`) strips secret keys and auth tokens from error traces and exception messages.

---

## 4. Directory Layout & Isolation Boundaries

- **`src/`**: Houses all pipeline domain logic sliced strictly per pipeline stage.
  - `src/ingestion/`: Ingestion interfaces, loaders, batch models, exceptions, and service.
  - `src/indexing/`: Indexing interfaces, chunker adapters, embedding adapters (`BgeM3Embedder`), and vector store adapters (`ChromaVectorStore`).
  - `src/retrieval/`: Retrieval interfaces, query value objects, `DenseRetriever` adapter, exceptions, and `ContextFormatter`.
  - `src/generation/`: Generation interfaces, configuration loader, prompt builder, citation parser, and provider adapters (`OpenAIGenerator`, `AnthropicGenerator`).
- **`evaluation/`**: Dedicated environment for benchmark datasets, gold standard QA pairs, and retrieval/synthesis metric calculations.
- **`tests/`**: Pytest test suites covering ingestion, chunking, lineage, embedding, sequence boundaries, vector storage, similarity search, dense retrieval, metadata filtering, score thresholding, context formatting, and generation adapters.
- **`scripts/`**: Operational and verification scripts (`verify_scaffold.py`, `run_ingestion_pipeline.py`, `run_indexing_pipeline.py`, `run_retrieval_pipeline.py`, `run_rag_pipeline.py`).
- **`data/`**: Local persistence directory isolated by `.gitignore` rules (`raw/`, `processed/`, `vector_store/`, `cache/`).



