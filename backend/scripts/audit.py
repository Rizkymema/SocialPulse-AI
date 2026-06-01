import os
import sys
from dotenv import load_dotenv

# Add parent directory to path so app imports work
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

load_dotenv()

from app.database import get_supabase
from app.utils.comments import comments_from_row

def main():
    db = get_supabase()
    res = db.table("scraped_posts").select("*").execute()
    posts = res.data or []
    
    print(f"Total posts found: {len(posts)}")
    mismatch_count = 0
    for post in posts:
        post_id = post.get("id")
        url = post.get("url")
        platform = post.get("platform")
        platform_comments = int(post.get("comments") or 0)
        scraped_comments_count = int(post.get("scraped_comments_count") or 0)
        
        comments_list = comments_from_row(post)
        stored_comments_count = len(comments_list)
        
        has_mismatch = (
            platform_comments > scraped_comments_count
            or scraped_comments_count != stored_comments_count
        )
        
        if has_mismatch:
            mismatch_count += 1
            print(f"\nMismatch Post #{mismatch_count}:")
            print(f"  ID: {post_id}")
            print(f"  Platform: {platform}")
            print(f"  URL: {url}")
            print(f"  Platform Comments: {platform_comments}")
            print(f"  Scraped Comments Count (db field): {scraped_comments_count}")
            print(f"  Stored Comments Count (raw_data len): {stored_comments_count}")

if __name__ == "__main__":
    main()
