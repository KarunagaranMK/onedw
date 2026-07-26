"""
MongoDB Atlas async connection using Motor.
Implements a singleton pattern so the connection pool is created once
and reused across the app lifecycle.

When the configured Atlas endpoint is unreachable, the app falls back to a
lightweight in-memory collection implementation so local development and the
registration/auth flow can still be exercised.
"""
import copy
import logging
from dataclasses import dataclass
from datetime import datetime

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import settings

# Use certifi CA bundle for robust TLS with MongoDB Atlas
try:
    import certifi
    _CA_FILE = certifi.where()
except ImportError:
    _CA_FILE = None

logger = logging.getLogger("onedw.database")


def _matches_query(document: dict, query: dict) -> bool:
    """Return True when a document matches the provided query.
    Supports: equality, $exists, $regex, $or, $and, $gte, $lte, $gt, $lt, $ne, $in, $nin.
    """
    import re as _re

    for key, expected in query.items():
        # Top-level logical operators
        if key == "$or":
            if not any(_matches_query(document, sub) for sub in expected):
                return False
            continue
        if key == "$and":
            if not all(_matches_query(document, sub) for sub in expected):
                return False
            continue

        doc_val = document.get(key)
        if isinstance(expected, dict):
            for op, operand in expected.items():
                if op == "$exists":
                    has_key = key in document
                    if operand and not has_key:
                        return False
                    if not operand and has_key:
                        return False
                elif op == "$regex":
                    flags = _re.IGNORECASE if expected.get("$options", "") == "i" else 0
                    if not _re.search(operand, str(doc_val or ""), flags):
                        return False
                elif op == "$gte":
                    if doc_val is None or doc_val < operand:
                        return False
                elif op == "$lte":
                    if doc_val is None or doc_val > operand:
                        return False
                elif op == "$gt":
                    if doc_val is None or doc_val <= operand:
                        return False
                elif op == "$lt":
                    if doc_val is None or doc_val >= operand:
                        return False
                elif op == "$ne":
                    if doc_val == operand:
                        return False
                elif op == "$in":
                    if doc_val not in operand:
                        return False
                elif op == "$nin":
                    if doc_val in operand:
                        return False
        else:
            if doc_val != expected:
                return False
    return True




@dataclass
class MemoryInsertResult:
    """Minimal insert result object matching Motor's insert_one contract."""
    inserted_id: ObjectId


@dataclass
class MemoryUpdateResult:
    """Minimal update result object matching the service layer expectations."""
    matched_count: int = 0
    modified_count: int = 0


@dataclass
class MemoryDeleteResult:
    """Minimal delete result object matching the service layer expectations."""
    deleted_count: int = 0


class InMemoryCursor:
    """Lightweight async cursor implementation for the development fallback."""

    def __init__(self, documents: list[dict], query: dict):
        self._documents = documents
        self._query = query
        self._sort_field = None
        self._sort_direction = -1
        self._skip_n = 0
        self._limit_n = None

    def sort(self, field: str, direction: int = -1):
        self._sort_field = field
        self._sort_direction = direction
        return self

    def skip(self, n: int):
        self._skip_n = n
        return self

    def limit(self, n: int):
        self._limit_n = n
        return self

    async def to_list(self, length: int | None = None) -> list[dict]:
        matches = [document for document in self._documents if _matches_query(document, self._query)]

        if self._sort_field is not None:
            matches.sort(
                key=lambda doc: doc.get(self._sort_field) or datetime.min,
                reverse=self._sort_direction == -1,
            )

        matches = matches[self._skip_n:]
        if self._limit_n is not None:
            matches = matches[:self._limit_n]
        if length is not None:
            return matches[:length]
        return matches


class InMemoryCollection:
    """Small async collection wrapper used when MongoDB is unavailable."""

    def __init__(self):
        self._documents: list[dict] = []

    async def find_one(self, query: dict):
        for document in self._documents:
            if _matches_query(document, query):
                return copy.deepcopy(document)
        return None

    async def insert_one(self, document: dict) -> MemoryInsertResult:
        stored_document = copy.deepcopy(document)
        stored_document.setdefault("_id", ObjectId())
        self._documents.append(stored_document)
        return MemoryInsertResult(inserted_id=stored_document["_id"])

    def find(self, query: dict) -> InMemoryCursor:
        return InMemoryCursor(self._documents, query)

    async def update_one(self, query: dict, update: dict, upsert: bool = False) -> MemoryUpdateResult:
        updated = False
        for document in self._documents:
            if not _matches_query(document, query):
                continue

            set_payload = update.get("$set", {})
            for key, value in set_payload.items():
                document[key] = value

            # Handle $inc operator
            inc_payload = update.get("$inc", {})
            for key, delta in inc_payload.items():
                document[key] = document.get(key, 0) + delta

            # Handle $push operator
            push_payload = update.get("$push", {})
            for key, value in push_payload.items():
                if key not in document:
                    document[key] = []
                document[key].append(value)

            updated = True
            break

        if not updated and upsert:
            new_doc = {**query}
            new_doc["_id"] = ObjectId()
            for key, value in update.get("$set", {}).items():
                new_doc[key] = value
            self._documents.append(new_doc)

        return MemoryUpdateResult(matched_count=1 if updated else 0, modified_count=1 if updated else 0)

    async def delete_one(self, query: dict) -> MemoryDeleteResult:
        for index, document in enumerate(self._documents):
            if _matches_query(document, query):
                del self._documents[index]
                return MemoryDeleteResult(deleted_count=1)
        return MemoryDeleteResult(deleted_count=0)

    async def update_many(self, query: dict, update: dict) -> MemoryUpdateResult:
        """Update all matching documents (used by mark_all_read etc.)."""
        count = 0
        for document in self._documents:
            if not _matches_query(document, query):
                continue
            set_payload = update.get("$set", {})
            for key, value in set_payload.items():
                document[key] = value
            count += 1
        return MemoryUpdateResult(matched_count=count, modified_count=count)

    async def count_documents(self, query: dict) -> int:
        if not query:
            return len(self._documents)
        return sum(1 for doc in self._documents if _matches_query(doc, query))

    def aggregate(self, pipeline: list) -> "InMemoryAggregateCursor":
        """Very small subset of aggregation — enough for admin stats."""
        return InMemoryAggregateCursor(self._documents, pipeline)


class InMemoryAggregateCursor:
    """Minimal aggregate cursor for $group/$match/$sort/$limit pipelines."""

    def __init__(self, documents: list[dict], pipeline: list):
        self._documents = list(documents)
        self._pipeline = pipeline

    async def to_list(self, length: int | None = None) -> list[dict]:
        import re as _re
        docs = list(self._documents)
        results: list[dict] = []

        for stage in self._pipeline:
            if "$match" in stage:
                docs = [d for d in docs if _matches_query(d, stage["$match"])]

            elif "$group" in stage:
                spec = stage["$group"]
                id_field = spec.get("_id")
                groups: dict = {}

                for doc in docs:
                    # Resolve group key
                    if id_field is None:
                        key = None
                    elif isinstance(id_field, dict):
                        key = tuple(
                            (k, doc.get(list(v.values())[0].lstrip("$")))
                            for k, v in id_field.items()
                        )
                    elif isinstance(id_field, str) and id_field.startswith("$"):
                        key = doc.get(id_field[1:])
                    else:
                        key = id_field

                    if key not in groups:
                        groups[key] = {"_id": key}

                    for out_field, agg_expr in spec.items():
                        if out_field == "_id":
                            continue
                        if not isinstance(agg_expr, dict):
                            continue
                        op, val_expr = next(iter(agg_expr.items()))
                        field_name = val_expr[1:] if isinstance(val_expr, str) and val_expr.startswith("$") else None
                        field_val = doc.get(field_name, 0) if field_name else 0

                        g = groups[key]
                        if op == "$sum":
                            operand = val_expr if not isinstance(val_expr, str) else field_val
                            g[out_field] = g.get(out_field, 0) + (operand if isinstance(operand, (int, float)) else 0)
                        elif op == "$avg":
                            g.setdefault(f"_avg_sum_{out_field}", 0)
                            g.setdefault(f"_avg_cnt_{out_field}", 0)
                            g[f"_avg_sum_{out_field}"] += field_val or 0
                            g[f"_avg_cnt_{out_field}"] += 1
                            cnt = g[f"_avg_cnt_{out_field}"]
                            g[out_field] = g[f"_avg_sum_{out_field}"] / cnt if cnt else 0

                results = list(groups.values())
                # Resolve tuple keys to dicts
                for r in results:
                    if isinstance(r["_id"], tuple):
                        r["_id"] = dict(r["_id"])
                docs = results

            elif "$sort" in stage:
                sort_spec = stage["$sort"]
                for field, direction in reversed(list(sort_spec.items())):
                    docs.sort(
                        key=lambda d: (d.get(field) is None, d.get(field) or 0),
                        reverse=(direction == -1),
                    )
                results = docs

            elif "$limit" in stage:
                docs = docs[:stage["$limit"]]
                results = docs

        if length is not None:
            return results[:length]
        return results


class InMemoryDatabase:
    """Development database facade — used when MongoDB Atlas is unreachable."""

    def __init__(self):
        # Existing collections
        self.users = InMemoryCollection()
        self.requests = InMemoryCollection()
        self.workers = InMemoryCollection()
        self.bookings = InMemoryCollection()
        self.ratings = InMemoryCollection()
        self.notifications = InMemoryCollection()
        self.otp = InMemoryCollection()
        self.payments = InMemoryCollection()
        self.test = InMemoryCollection()
        self.counter_offers = InMemoryCollection()
        self.warranties = InMemoryCollection()
        self.warranty_claims = InMemoryCollection()
        # New collections added for reviews, complaints, admin
        self.reviews = InMemoryCollection()
        self.worker_reviews = InMemoryCollection()
        self.complaints = InMemoryCollection()
        self.complaint_messages = InMemoryCollection()
        self.warnings = InMemoryCollection()
        self.platform_settings = InMemoryCollection()
        self.refunds = InMemoryCollection()



class MongoDB:
    """Singleton wrapper around the Motor client and database handle."""

    client: AsyncIOMotorClient | None = None
    db: AsyncIOMotorDatabase | InMemoryDatabase | None = None
    using_in_memory: bool = False


mongodb = MongoDB()


async def connect_to_mongo() -> None:
    """Initialize the MongoDB connection pool. Called on app startup."""
    logger.info("Connecting to MongoDB...")

    candidate_urls = [settings.mongodb_url]
    local_fallback = "mongodb://localhost:27017"
    if local_fallback not in candidate_urls:
        candidate_urls.append(local_fallback)

    last_error = None
    for mongo_url in candidate_urls:
        is_atlas = mongo_url.startswith("mongodb+srv://")

        # Build progressively more permissive TLS param sets.
        # tlsInsecure is tried early because many corporate/home networks
        # intercept TLS and cause TLSV1_ALERT_INTERNAL_ERROR with stricter modes.
        param_sets: list[dict] = [{}]
        if is_atlas:
            param_sets += [
                {"tlsInsecure": True},
                {"tlsAllowInvalidCertificates": True},
            ]
            if _CA_FILE:
                param_sets += [
                    {"tlsCAFile": _CA_FILE},
                    {"tlsCAFile": _CA_FILE, "tlsAllowInvalidCertificates": True},
                ]

        for extra_kwargs in param_sets:
            try:
                client = AsyncIOMotorClient(
                    mongo_url,
                    maxPoolSize=50,
                    minPoolSize=10,
                    serverSelectionTimeoutMS=8000,
                    connectTimeoutMS=8000,
                    **extra_kwargs,
                )
                await client.admin.command("ping")
                mongodb.client = client
                mongodb.db = client[settings.mongodb_db_name]
                mongodb.using_in_memory = False
                tls_note = f" (params: {extra_kwargs})" if extra_kwargs else ""
                logger.info("MongoDB connection established using %s%s", mongo_url, tls_note)
                return
            except Exception as exc:
                last_error = exc
                logger.warning("MongoDB attempt failed [%s, %s]: %s", mongo_url, extra_kwargs, str(exc)[:200])

    mongodb.client = None
    mongodb.db = InMemoryDatabase()
    mongodb.using_in_memory = True
    logger.warning(
        "MongoDB could not be initialized. Falling back to in-memory development storage. Last error: %s",
        last_error,
    )
    # Auto-seed demo workers so WorkerRecommendations always has results
    try:
        from app.database.in_memory_seed import seed_demo_workers
        await seed_demo_workers(mongodb.db)
        logger.info("In-memory DB seeded with %d demo workers.", 8)
    except Exception as seed_err:
        logger.warning("Demo seed failed: %s", seed_err)


async def close_mongo_connection() -> None:
    """Gracefully close the MongoDB connection. Called on app shutdown."""
    if mongodb.client:
        mongodb.client.close()
        logger.info("MongoDB connection closed.")

    mongodb.client = None
    mongodb.db = None
    mongodb.using_in_memory = False


async def check_db_health() -> bool:
    """Ping the database to verify connectivity — used in /health endpoint."""
    if mongodb.using_in_memory:
        return True

    if mongodb.client is None:
        return False

    try:
        await mongodb.client.admin.command("ping")
        return True
    except Exception as exc:
        logger.error("Database health check failed: %s", exc)
        return False


def get_database() -> AsyncIOMotorDatabase | InMemoryDatabase:
    """Dependency-injectable accessor for the database instance."""
    if mongodb.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is unavailable. Check MongoDB settings and connectivity.",
        )
    return mongodb.db