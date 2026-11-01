"""
Crawler Resilience & Fault-Tolerance Engine
Provides multi-provider fallback chains, exponential backoff with jitter,
circuit breakers, dynamic event-loop safe clients, and zero-crash guarantees.
"""
import httpx
import asyncio
import logging
import random
import time
from typing import List, Dict, Any, Optional, Callable

logger = logging.getLogger("nirmaan.crawlers.resilience")

class CircuitBreaker:
    """Tracks provider failure rates and temporarily trips to avoid hammering dead endpoints."""
    def __init__(self, failure_threshold: int = 4, recovery_timeout: float = 30.0):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = 0.0
        self.is_open = False

    def record_success(self):
        self.failure_count = 0
        self.is_open = False

    def record_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.failure_threshold:
            self.is_open = True
            logger.warning(f"Circuit breaker TRIPPED! Provider will be bypassed for {self.recovery_timeout}s.")

    def can_attempt(self) -> bool:
        if not self.is_open:
            return True
        if time.time() - self.last_failure_time > self.recovery_timeout:
            self.is_open = False
            self.failure_count = 0
            logger.info("Circuit breaker entered HALF-OPEN state; allowing retry.")
            return True
        return False

class ResilientHttpClient:
    """
    HTTP Client with automatic retry, jitter, circuit breakers, and provider failover.
    Engineered to be completely safe against Python Event Loop reuse bugs.
    """
    def __init__(self, timeout: float = 6.0, max_retries: int = 2):
        self.timeout = timeout
        self.max_retries = max_retries
        self.circuit_breakers: Dict[str, CircuitBreaker] = {}

    def _get_circuit_breaker(self, host: str) -> CircuitBreaker:
        if host not in self.circuit_breakers:
            self.circuit_breakers[host] = CircuitBreaker()
        return self.circuit_breakers[host]

    async def get_with_failover(
        self,
        providers: List[Dict[str, Any]],
        parser_func: Callable[[httpx.Response], List[Dict[str, Any]]]
    ) -> List[Dict[str, Any]]:
        """
        Tries providers in priority order.
        Creates client safely bound to the currently active event loop.
        """
        async with httpx.AsyncClient(
            timeout=self.timeout,
            follow_redirects=True,
            limits=httpx.Limits(max_keepalive_connections=10, max_connections=25)
        ) as client:
            for provider in providers:
                url = provider["url"]
                params = provider.get("params", {})
                headers = provider.get("headers", {"User-Agent": "NIRMAAN-Forensic-Engine/1.0"})
                host = httpx.URL(url).host
                cb = self._get_circuit_breaker(host)

                if not cb.can_attempt():
                    logger.warning(f"Skipping tripped provider: {host}")
                    continue

                provider_failed = False
                for attempt in range(1, self.max_retries + 1):
                    try:
                        response = await client.get(url, params=params, headers=headers)

                        if response.status_code == 429:
                            provider_failed = True
                            # Cap retry delay to prevent unbounded waits (ERR-22)
                            try:
                                retry_after = min(float(response.headers.get("Retry-After", 1.0)), 3.0)
                            except (ValueError, TypeError):
                                retry_after = 1.0
                            logger.warning(f"Rate limited (429) on {host}. Attempt {attempt}/{self.max_retries}. Backing off {retry_after}s.")
                            await asyncio.sleep(retry_after)
                            continue

                        if response.status_code >= 500:
                            provider_failed = True
                            logger.warning(f"Server error ({response.status_code}) on {host}. Retrying...")
                            await asyncio.sleep(0.3 * (2 ** attempt) + random.uniform(0, 0.1))
                            continue

                        if response.status_code in (400, 404):
                            # Client-side 400/404 (e.g. unindexed wallet) is not a network or provider outage
                            logger.info(f"Target address returned {response.status_code} on {host}; not an infrastructure failure.")
                            provider_failed = False
                            break

                        if response.status_code == 200:
                            try:
                                results = parser_func(response)
                                cb.record_success()
                                return results
                            except Exception as parse_err:
                                logger.warning(f"Parser error on payload from {host}: {parse_err}")
                                provider_failed = False
                                break

                    except (httpx.TimeoutException, httpx.ConnectError, httpx.NetworkError) as net_err:
                        provider_failed = True
                        logger.warning(f"Network error on {host} (attempt {attempt}/{self.max_retries}): {net_err}")
                        await asyncio.sleep(0.3 * (2 ** attempt) + random.uniform(0, 0.1))
                    except Exception as err:
                        logger.warning(f"Unexpected error querying {host}: {err}")
                        break

                if provider_failed:
                    cb.record_failure()
                    logger.info("Failing over to secondary blockchain provider...")

        logger.debug("All live blockchain providers returned empty or unreachable.")
        return []

    async def post_json(self, url: str, payload: dict, timeout: Optional[float] = None) -> Optional[dict]:
        """Safe POST helper for JSON-RPC or energy delegation checks."""
        try:
            async with httpx.AsyncClient(timeout=timeout or self.timeout) as client:
                r = await client.post(url, json=payload, headers={"User-Agent": "NIRMAAN-Forensic-Engine/1.0"})
                if r.status_code == 200:
                    return r.json()
        except Exception as e:
            logger.debug(f"post_json failed for {url}: {e}")
        return None

    async def close(self):
        pass
