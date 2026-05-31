from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict


class BaseScraper(ABC):
    """Abstract scraper – all platform scrapers must implement `scrape()`."""

    @abstractmethod
    def scrape(self, url: str) -> Dict[str, Any]:
        """
        Scrape a public URL and return a raw dictionary of extracted data.
        Raises ScraperError on failure.
        """
        ...


class ScraperError(Exception):
    """Raised when a scraper cannot extract data from the provided URL."""
