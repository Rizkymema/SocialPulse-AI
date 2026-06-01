import os
import sys
import logging
from dotenv import load_dotenv

# Setup path and config
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
load_dotenv()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

from app.database import get_supabase
from app.scrapers import get_scraper
from app.core.normalizer import DataNormalizer
from app.utils.comments import comments_from_row, merge_post_comment_state

def run_recovery():
    db = get_supabase()
    logger.info("Fetching scraped posts from Supabase...")
    res = db.table("scraped_posts").select("*").execute()
    posts = res.data or []
    
    logger.info(f"Analyzing {len(posts)} posts for comment count mismatch...")
    mismatch_posts = []
    
    for post in posts:
        post_id = post.get("id")
        url = post.get("url")
        platform = post.get("platform")
        platform_comments = int(post.get("comments") or 0)
        scraped_comments_count = int(post.get("scraped_comments_count") or 0)
        stored_comments_count = len(comments_from_row(post))
        
        # Mismatch condition: platform comments count is greater than scraped comments count,
        # or there is divergence between database field scraped_comments_count and raw_data comments array length.
        if platform_comments > scraped_comments_count or scraped_comments_count != stored_comments_count:
            mismatch_posts.append((post, platform_comments, scraped_comments_count, stored_comments_count))
            
    if not mismatch_posts:
        logger.info("No post with mismatching comment count found. Database is healthy!")
        return

    logger.info(f"Found {len(mismatch_posts)} posts with comment mismatch/partial scraped data.")
    
    for idx, (post, p_count, s_count, stored_count) in enumerate(mismatch_posts, 1):
        post_id = post["id"]
        url = post["url"]
        platform = post["platform"]
        
        logger.info(f"[{idx}/{len(mismatch_posts)}] Starting recovery for post {post_id} ({platform})")
        logger.info(f"  URL: {url}")
        logger.info(f"  Current Platform Comments: {p_count}, Scraped: {s_count}, Stored (raw_data): {stored_count}")
        
        try:
            # 1. Scrape URL
            scraper = get_scraper(platform)
            logger.info(f"  Scraping URL {url}...")
            
            import inspect
            if "comment_limit" in inspect.signature(scraper.scrape_with_retry).parameters:
                raw_data = scraper.scrape_with_retry(url, comment_limit=500)
            else:
                raw_data = scraper.scrape_with_retry(url)
                
            # 2. Normalize
            logger.info("  Normalizing scraped data...")
            normalised = DataNormalizer.normalize(platform, raw_data, url).model_dump(mode="json")
            
            # 3. Merge
            logger.info("  Merging old comments with new comments...")
            merged = merge_post_comment_state(post, normalised)
            
            # 4. Save to database
            logger.info("  Saving recovered post data to Supabase...")
            db.table("scraped_posts").update({
                **merged,
                "updated_at": merged.get("updated_at") or post.get("updated_at")
            }).eq("id", post_id).execute()
            
            new_stored_count = len(comments_from_row(merged))
            logger.info(f"  Successfully recovered post {post_id}!")
            logger.info(f"  New Scraped Comments Count: {merged['scraped_comments_count']}, New Stored: {new_stored_count}")
            
        except Exception as e:
            logger.error(f"  Failed to recover post {post_id}: {e}", exc_info=True)

if __name__ == "__main__":
    run_recovery()
